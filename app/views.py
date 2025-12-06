from django.contrib.auth import get_user_model
from django.db.models import Q, Avg, Count

from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework_simplejwt.views import TokenObtainPairView
from .models import PasswordResetToken

from .models import (
    Profile,
    Content,
    Rating,
    Review,
    UserLibraryEntry,
    Activity,
    List,
    ListItem,
    Follow,
)
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ContentSerializer,
    RatingSerializer,
    ReviewSerializer,
    UserLibraryEntrySerializer,
    ActivitySerializer,
    ListSerializer,
    ListItemSerializer,
    FollowSerializer,
)

from .services.tmdb import search_movies, get_movie_details, TMDBError
from .services.google_books import search_books, get_book_details, GoogleBooksError

User = get_user_model()


# -----------------------------
# Auth / User / Profile
# -----------------------------

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class IsReviewOwnerOrReadOnly(permissions.BasePermission):
    """
    Yorumlar için:
    - Herkes GET (read) yapabilir
    - Sadece sahibi PUT/PATCH/DELETE yapabilir
    """

    def has_object_permission(self, request, view, obj):
        # Okuma isteği ise herkese izin
        if request.method in permissions.SAFE_METHODS:
            return True
        # Değilse sadece kendi yorumu
        return obj.user == request.user


class MeView(APIView):
    """
    GET /api/auth/me/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /api/profiles/
      - ?username= kullanarak tek profil çekilebilir
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Profile.objects.select_related("user")
        username = self.request.query_params.get("username")
        if username:
            qs = qs.filter(user__username=username)
        return qs


class MyProfileView(APIView):
    """
    GET /api/profiles/me/  -> kendi profilini getir
    PUT /api/profiles/me/  -> avatar_url, bio güncelle
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



# -----------------------------
# Content
# -----------------------------

class ContentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ContentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Content.objects.all().annotate(
            average_rating=Avg("ratings__score"),
            rating_count=Count("ratings"),
        )
        query = self.request.query_params.get("q")
        content_type = self.request.query_params.get("type")  # movie / book
        if query:
            qs = qs.filter(
                Q(title__icontains=query)
                | Q(original_title__icontains=query)
            )
        if content_type in ["movie", "book"]:
            qs = qs.filter(type=content_type)
        return qs


# -----------------------------
# Rating
# -----------------------------

class RatingCreateView(generics.CreateAPIView):
    """
    POST /api/ratings/
    Body: { "content_id": ..., "score": 1-10 }
    """
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


# -----------------------------
# Review
# -----------------------------

class ReviewListCreateView(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsReviewOwnerOrReadOnly,
    ]

    def get_queryset(self):
        qs = Review.objects.select_related("user", "content")
        content_id = self.request.query_params.get("content")
        if content_id:
            qs = qs.filter(content_id=content_id)
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# -----------------------------
# Library (UserLibraryEntry)
# -----------------------------

class UserLibraryEntryViewSet(viewsets.ModelViewSet):
    serializer_class = UserLibraryEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if user_id:
            qs = UserLibraryEntry.objects.filter(user_id=user_id).select_related(
                "content"
            )
        else:
            qs = UserLibraryEntry.objects.filter(
                user=self.request.user
            ).select_related("content")

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs.order_by("-created_at")



# -----------------------------
# Activity (Feed)
# -----------------------------

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        user_id = self.request.query_params.get("user_id")
        if user_id:
            return Activity.objects.select_related("user", "content").filter(
                user_id=user_id
            ).order_by("-created_at")

        following_ids = Follow.objects.filter(
            follower=user
        ).values_list("following_id", flat=True)

        qs = Activity.objects.select_related("user", "content").filter(
            Q(user=user) | Q(user_id__in=following_ids)
        )
        return qs.order_by("-created_at")
    
class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/request/
    Body: { "identifier": "email veya kullanıcı adı" }

    Gerçekte mail atmamız gerekirdi; bu projede
    token'ı response içinde döndürüp frontend'e
    yönlendiriyoruz.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["identifier"]

        # Kullanıcıyı e-posta veya username ile bulmayı dene
        user = User.objects.filter(email__iexact=identifier).first()
        if not user:
            user = User.objects.filter(username__iexact=identifier).first()

        # Güvenlik açısından kullanıcı yoksa dahi 200 dönüp
        # genel bir mesaj vermek daha iyi.
        if not user:
            return Response(
                {
                    "message": "Eğer bu bilgilerle kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı oluşturuldu."
                },
                status=status.HTTP_200_OK,
            )

        token = PasswordResetToken.generate_token()
        PasswordResetToken.objects.create(user=user, token=token)

        # Gerçek hayatta bu token'ı maille gönderecektik.
        # Projede rahat test edebilmek için token'ı da döndürüyoruz.
        return Response(
            {
                "message": "Şifre sıfırlama bağlantısı oluşturuldu.",
                "token": token,
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/
    Body: { "token": "...", "new_password": "..." }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_value = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            reset_token = PasswordResetToken.objects.get(token=token_value)
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"detail": "Geçersiz veya kullanılmış token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_token.is_used or reset_token.is_expired():
            return Response(
                {"detail": "Bu token artık geçerli değil."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset_token.user
        user.set_password(new_password)
        user.save()

        reset_token.is_used = True
        reset_token.save()

        return Response(
            {"message": "Şifre başarıyla güncellendi."},
            status=status.HTTP_200_OK,
        )



# -----------------------------
# Follow
# -----------------------------

class FollowViewSet(viewsets.ModelViewSet):
    """
    /api/follows/
    Basit takip sistemi.
    """
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user)

    def perform_create(self, serializer):
        serializer.save(follower=self.request.user)


# -----------------------------
# List & ListItem (Özel Listeler)
# -----------------------------

class ListViewSet(viewsets.ModelViewSet):
    """
    /api/lists/
    Kullanıcıya ait özel listeler.
    """
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Kendi listeleri
        qs = List.objects.filter(user=self.request.user)
        # Başkasının listelerini görmek istiyorsak is_public olması gerekiyor
        owner_id = self.request.query_params.get("user_id")
        if owner_id:
            qs = List.objects.filter(user_id=owner_id, is_public=True)
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ListItemViewSet(viewsets.ModelViewSet):
    """
    /api/list-items/
    Bir listeye içerik ekleme/çıkarma.
    """
    serializer_class = ListItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ListItem.objects.filter(list__user=self.request.user).select_related(
            "list", "content"
        )

    def perform_create(self, serializer):
        serializer.save()


# -----------------------------
# Harici API entegrasyonu (TMDb & Google Books)
# -----------------------------

class ExternalMovieSearchView(APIView):
    """
    GET /api/external/movies/search/?q=...
    TMDb üzerinden film arama.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get("q")
        if not q:
            return Response(
                {"detail": "q parametresi gerekli."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            results = search_movies(q)
            return Response(results)
        except TMDBError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class ExternalBookSearchView(APIView):
    """
    GET /api/external/books/search/?q=...
    Google Books üzerinden kitap arama.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get("q")
        if not q:
            return Response(
                {"detail": "q parametresi gerekli."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            results = search_books(q)
            return Response(results)
        except GoogleBooksError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class ExternalImportView(APIView):
    """
    POST /api/external/import/
    {
      "source": "tmdb" | "google_books",
      "external_id": "123"
    }

    Harici API'den detayları çekip Content kaydı oluşturur (veya varsa getirir).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        source = request.data.get("source")
        external_id = request.data.get("external_id")

        if not source or not external_id:
            return Response(
                {"detail": "source ve external_id alanları zorunlu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Zaten var mı?
        existing = Content.objects.filter(
            source=source,
            external_id=str(external_id),
        ).first()
        if existing:
            return Response(ContentSerializer(existing).data)

        # Harici API'den çek
        try:
            if source == "tmdb":
                details = get_movie_details(int(external_id))
            elif source == "google_books":
                details = get_book_details(str(external_id))
            else:
                return Response(
                    {"detail": "Desteklenmeyen source."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (TMDBError, GoogleBooksError) as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        content = Content.objects.create(
            type=details["type"],
            source=details["source"],
            external_id=str(details["external_id"]),
            title=details.get("title") or "",
            original_title=details.get("original_title") or "",
            year=details.get("year"),
            description=details.get("description") or "",
            poster_url=details.get("poster_url") or "",
            runtime_minutes=details.get("runtime_minutes"),
            page_count=details.get("page_count"),
            directors=details.get("directors", []),
            writers=details.get("writers", []),
            authors=details.get("authors", []),
            genres=details.get("genres", []),
            cast=details.get("cast", []),
        )

        return Response(
            ContentSerializer(content).data,
            status=status.HTTP_201_CREATED,
        )
class IsReviewOwnerOrReadOnly(permissions.BasePermission):
    """
    Yorumlar için:
    - Herkes GET yapabilir
    - Sadece sahibi PUT/PATCH/DELETE yapabilir
    """

    def has_object_permission(self, request, view, obj):
        # Okuma isteği ise herkese izin
        if request.method in permissions.SAFE_METHODS:
            return True
        # Değilse sadece kendi yorumu
        return obj.user == request.user


class ReviewViewSet(viewsets.ModelViewSet):
    """
    /api/reviews/ -> GET (liste), POST (oluştur)
    /api/reviews/<id>/ -> GET (detay), PUT/PATCH (güncelle), DELETE (sil)
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsReviewOwnerOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.select_related("user", "content")
        # ?content=ID query param'ı ile filtreleme
        content_id = self.request.query_params.get("content")
        if content_id:
            qs = qs.filter(content_id=content_id)
        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        # Yeni yorum oluştururken user otomatik login user olsun
        serializer.save(user=self.request.user)