from celery import shared_task
from django.utils import timezone

from apps.videos.models import Video

from .models import ProcessingJob
from .services import transcode_video


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=5, retry_kwargs={"max_retries": 2})
def initiate_transcoding(self, video_id: str):
    video = Video.objects.get(id=video_id)
    job, _ = ProcessingJob.objects.get_or_create(video=video)
    job.status = ProcessingJob.Status.RUNNING
    job.current_step = "Transcoding 720p HLS rendition"
    job.progress_pct = 25
    job.error_log = ""
    job.save()

    try:
        transcode_video(video)
        video.status = Video.Status.READY
        video.published_at = timezone.now()
        video.processing_error = ""
        video.save(update_fields=["status", "published_at", "processing_error", "master_playlist", "updated_at"])

        job.status = ProcessingJob.Status.COMPLETED
        job.current_step = "Ready for playback"
        job.progress_pct = 100
        job.save()
    except Exception as exc:
        video.status = Video.Status.FAILED
        video.processing_error = str(exc)
        video.save(update_fields=["status", "processing_error", "updated_at"])

        job.status = ProcessingJob.Status.FAILED
        job.current_step = "Processing failed"
        job.error_log = str(exc)
        job.save()
        raise

