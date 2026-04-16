from uuid import uuid4

from django.db import models

from apps.videos.models import Video


class ProcessingJob(models.Model):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    video = models.OneToOneField(Video, on_delete=models.CASCADE, related_name="processing_job")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    progress_pct = models.PositiveSmallIntegerField(default=0)
    current_step = models.CharField(max_length=100, blank=True)
    error_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.video.title} ({self.status})"

