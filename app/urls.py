from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import (
    ContentViewSet,
    ActivityViewSet,
    UserLibraryEntryViewSet,
    ProfileViewSet,
    ExternalMovieSearchView,
    ExternalBookSearchView,
    RegisterView,
    MeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ReviewViewSet,
)

router = DefaultRouter()

# İçerikler
router.register("contents", ContentViewSet, basename="content")

# Aktiviteler (feed)
router.register("activities", ActivityViewSet, basename="activity")

# Kullanıcı kütüphanesi
router.register("library-entries", UserLibraryEntryViewSet, basename="library-entry")

# Kullanıcı profilleri
router.register("profiles", ProfileViewSet, basename="profile")

# Yorumlar (tam CRUD)
router.register("reviews", ReviewViewSet, basename="review")


urlpatterns = [
    # Router'a bağlı tüm viewset endpoint'leri
    path("", include(router.urls)),

    # Auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    path(
        "auth/token/",
        TokenObtainPairView.as_view(),          # ← Artık buradan geliyor
        name="token_obtain_pair",
    ),
    path("auth/me/", MeView.as_view(), name="auth-me"),

    # Şifre sıfırlama
    path(
        "auth/password-reset/request/",
        PasswordResetRequestView.as_view(),
        name="password-reset-request",
    ),
    path(
        "auth/password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),

    # Harici aramalar (TMDb & Google Books)
    path(
        "external/movies/search/",
        ExternalMovieSearchView.as_view(),
        name="external-movie-search",
    ),
    path(
        "external/books/search/",
        ExternalBookSearchView.as_view(),
        name="external-book-search",
    ),
]
