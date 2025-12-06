from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import PasswordResetToken

from .models import (
    Profile,
    Content,
    UserLibraryEntry,
    Rating,
    Review,
    List,
    ListItem,
    Follow,
    Activity,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    follow_id = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "id",
            "user_id",
            "username",
            "avatar_url",
            "bio",
            "followers_count",
            "following_count",
            "is_me",
            "is_following",
            "follow_id",
        ]

    def get_followers_count(self, obj):
        return Follow.objects.filter(following=obj.user).count()

    def get_following_count(self, obj):
        return Follow.objects.filter(follower=obj.user).count()

    def get_is_me(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.user == request.user

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(
            follower=request.user, following=obj.user
        ).exists()

    def get_follow_id(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        follow = Follow.objects.filter(
            follower=request.user, following=obj.user
        ).first()
        return follow.id if follow else None


class ContentSerializer(serializers.ModelSerializer):
    average_rating = serializers.FloatField(read_only=True)
    rating_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Content
        fields = [
            "id",
            "type",
            "source",
            "external_id",
            "title",
            "original_title",
            "year",
            "description",
            "poster_url",
            "runtime_minutes",
            "page_count",
            "directors",
            "writers",
            "authors",
            "genres",
            "cast",
            "average_rating",
            "rating_count",
        ]



class UserLibraryEntrySerializer(serializers.ModelSerializer):
    content = ContentSerializer(read_only=True)
    content_id = serializers.PrimaryKeyRelatedField(
        queryset=Content.objects.all(), source="content", write_only=True
    )

    class Meta:
        model = UserLibraryEntry
        fields = ["id", "status", "created_at", "content", "content_id"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        return super().create(validated_data)


class RatingSerializer(serializers.ModelSerializer):
    content = ContentSerializer(read_only=True)
    content_id = serializers.PrimaryKeyRelatedField(
        queryset=Content.objects.all(), source="content", write_only=True
    )

    class Meta:
        model = Rating
        fields = ["id", "score", "created_at", "updated_at", "content", "content_id"]

    def validate_score(self, value):
        if not 1 <= value <= 10:
            raise serializers.ValidationError("Puan 1 ile 10 arasında olmalıdır.")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        # aynı (user, content) için varsa update et
        rating, _ = Rating.objects.update_or_create(
            user=user,
            content=validated_data["content"],
            defaults={"score": validated_data["score"]},
        )
        return rating


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "content",
            "user",
            "username",
            "text",
            "created_at",
            "updated_at",
            "is_owner",
        ]
        read_only_fields = ["user", "created_at", "updated_at", "username", "is_owner"]

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.user == request.user



class ListItemSerializer(serializers.ModelSerializer):
    content = ContentSerializer(read_only=True)
    content_id = serializers.PrimaryKeyRelatedField(
        queryset=Content.objects.all(), source="content", write_only=True
    )

    class Meta:
        model = ListItem
        fields = ["id", "order", "added_at", "content", "content_id"]


class ListSerializer(serializers.ModelSerializer):
    items = ListItemSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = ["id", "name", "description", "is_public", "created_at", "items"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        return super().create(validated_data)


class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    following_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="following", write_only=True
    )

    class Meta:
        model = Follow
        fields = ["id", "follower", "following", "following_id", "created_at"]

    def create(self, validated_data):
        validated_data["follower"] = self.context["request"].user
        return super().create(validated_data)


class ActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    content = ContentSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "user",
            "content",
            "activity_type",
            "rating",
            "review",
            "list",
            "created_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        # Profil de otomatik oluşsun:
        Profile.objects.get_or_create(user=user)
        return user
    
class PasswordResetRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField()

    def validate_identifier(self, value):
        if not value.strip():
            raise serializers.ValidationError("Bu alan boş olamaz.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        # Basit bir validasyon, istersen güçlendirebilirsin
        if len(value) < 8:
            raise serializers.ValidationError("Şifre en az 8 karakter olmalıdır.")
        return value