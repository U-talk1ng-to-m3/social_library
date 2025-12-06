from django.conf import settings
from django.db import models
import secrets
from django.utils import timezone
from datetime import timedelta

User = settings.AUTH_USER_MODEL

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar_url = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile({self.user.username})"

class Content(models.Model):
    class ContentType(models.TextChoices):
        MOVIE = "movie", "Movie"
        BOOK = "book", "Book"

    type = models.CharField(max_length=10, choices=ContentType.choices)
    source = models.CharField(max_length=50)  # "tmdb", "google_books" vs.
    external_id = models.CharField(max_length=100)

    title = models.CharField(max_length=255)
    original_title = models.CharField(max_length=255, blank=True)
    year = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)
    poster_url = models.URLField(blank=True)

    runtime_minutes = models.IntegerField(null=True, blank=True)
    page_count = models.IntegerField(null=True, blank=True)

    # YENİ ALANLAR:
    directors = models.JSONField(default=list, blank=True)
    writers = models.JSONField(default=list, blank=True)
    authors = models.JSONField(default=list, blank=True)
    genres = models.JSONField(default=list, blank=True)
    cast = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("source", "external_id")

    def __str__(self):
        return self.title


class UserLibraryEntry(models.Model):
    class Status(models.TextChoices):
        WATCHED = "watched", "Watched"
        WATCHLIST = "watchlist", "Watchlist"
        READ = "read", "Read"
        TO_READ = "to_read", "To Read"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="library_entries"
    )
    content = models.ForeignKey(
        Content, on_delete=models.CASCADE, related_name="library_entries"
    )
    status = models.CharField(max_length=20, choices=Status.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "content", "status")

    def __str__(self):
        return f"{self.user} - {self.content} ({self.status})"


class Rating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ratings"
    )
    content = models.ForeignKey(
        Content, on_delete=models.CASCADE, related_name="ratings"
    )
    score = models.IntegerField()  # 1–10 arası olmasını DRF serializer ile kontrol ederiz
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "content")

    def __str__(self):
        return f"{self.content} - {self.user} ({self.score})"


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    content = models.ForeignKey(
        Content, on_delete=models.CASCADE, related_name="reviews"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # İstersen rating ile ilişkilendirebilirsin
    rating = models.OneToOneField(
        Rating, on_delete=models.SET_NULL, null=True, blank=True, related_name="review"
    )

    def __str__(self):
        return f"Review by {self.user} on {self.content}"


class List(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="lists"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user})"


class ListItem(models.Model):
    list = models.ForeignKey(
        List, on_delete=models.CASCADE, related_name="items"
    )
    content = models.ForeignKey(
        Content, on_delete=models.CASCADE, related_name="list_items"
    )
    order = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("list", "content")
        ordering = ["order", "added_at"]

    def __str__(self):
        return f"{self.content} in {self.list}"


class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following",
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "following")

    def __str__(self):
        return f"{self.follower} → {self.following}"


class Activity(models.Model):
    class ActivityType(models.TextChoices):
        RATING = "rating", "Rating"
        REVIEW = "review", "Review"
        LIBRARY = "library", "Library Update"
        LIST_ADD = "list_add", "Added to List"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities"
    )
    content = models.ForeignKey(
        Content, on_delete=models.CASCADE, related_name="activities", null=True, blank=True
    )
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)

    rating = models.ForeignKey(
        Rating, on_delete=models.SET_NULL, null=True, blank=True, related_name="activities"
    )
    review = models.ForeignKey(
        Review, on_delete=models.SET_NULL, null=True, blank=True, related_name="activities"
    )
    list = models.ForeignKey(
        List, on_delete=models.SET_NULL, null=True, blank=True, related_name="activities"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.activity_type} ({self.created_at})"
    

class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"PasswordResetToken({self.user}, used={self.is_used})"

    def is_expired(self) -> bool:
        return self.created_at < timezone.now() - timedelta(hours=24)

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)
