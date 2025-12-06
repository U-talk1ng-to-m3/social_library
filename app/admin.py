from django.contrib import admin
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


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "year", "source", "external_id")
    search_fields = ("title", "original_title", "external_id")
    list_filter = ("type", "source", "year")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user",)


@admin.register(UserLibraryEntry)
class UserLibraryEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "content", "status", "created_at")
    list_filter = ("status",)


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("user", "content", "score", "created_at")
    list_filter = ("score",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "content", "created_at")
    search_fields = ("text",)


@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "is_public", "created_at")
    list_filter = ("is_public",)


@admin.register(ListItem)
class ListItemAdmin(admin.ModelAdmin):
    list_display = ("list", "content", "order", "added_at")


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "following", "created_at")


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("user", "activity_type", "content", "created_at")
    list_filter = ("activity_type",)
