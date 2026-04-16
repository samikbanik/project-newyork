from uuid import uuid4

from django.conf import settings
from django.db import models


class Video(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        UPLOADING = "uploading", "Uploading"
        PROCESSING = "processing", "Processing"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    content_rating = models.CharField(max_length=10)
    release_year = models.PositiveSmallIntegerField()
    duration_secs = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    source_filename = models.CharField(max_length=255)
    file_size_bytes = models.BigIntegerField()
    raw_s3_key = models.CharField(max_length=1024, blank=True)
    multipart_upload_id = models.CharField(max_length=255, blank=True)
    hls_base_path = models.CharField(max_length=1024, blank=True)
    master_playlist = models.CharField(max_length=1024, blank=True)
    thumbnail_url = models.URLField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_videos",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    processing_error = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "published_at"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title

