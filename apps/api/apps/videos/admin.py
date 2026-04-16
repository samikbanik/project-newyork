from django.contrib import admin

from .models import Video


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "uploaded_by", "published_at", "created_at")
    list_filter = ("status", "content_rating")
    search_fields = ("title", "description", "source_filename")

