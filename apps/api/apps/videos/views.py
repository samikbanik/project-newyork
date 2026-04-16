from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.processing.models import ProcessingJob
from apps.processing.tasks import initiate_transcoding
from apps.shared.permissions import IsAdminRole
from apps.streaming.services import build_playback_payload

from .models import Video
from .serializers import (
    CompleteUploadSerializer,
    InitiateUploadSerializer,
    VideoDetailSerializer,
    VideoListSerializer,
)
from .services import create_multipart_upload, hls_base_path, master_playlist_key


class VideoListView(generics.ListAPIView):
    serializer_class = VideoListSerializer

    def get_queryset(self):
        return Video.objects.filter(
            status=Video.Status.READY,
            published_at__isnull=False,
        )


class VideoDetailView(generics.RetrieveAPIView):
    queryset = Video.objects.all()
    serializer_class = VideoDetailSerializer
    lookup_field = "id"


class PlaybackUrlView(APIView):
    def get(self, request, video_id):
        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist as exc:
            raise NotFound("Video not found.") from exc

        if video.status == Video.Status.PROCESSING:
            return Response(
                {"detail": "Video is still processing."},
                status=status.HTTP_409_CONFLICT,
            )
        if video.status != Video.Status.READY or not video.master_playlist:
            raise NotFound("Playback is not available for this video.")

        expires_at = timezone.now() + timedelta(seconds=14_400)
        payload = build_playback_payload(request=request, video=video)
        payload["expires_at"] = expires_at.isoformat()
        return Response(payload)


class InitiateUploadView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = InitiateUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        video = Video.objects.create(
            title=payload["title"],
            description=payload.get("description", ""),
            content_rating=payload["content_rating"],
            release_year=payload["release_year"],
            source_filename=payload["filename"],
            file_size_bytes=payload["file_size_bytes"],
            status=Video.Status.PENDING,
            uploaded_by=request.user,
        )

        multipart = create_multipart_upload(video, payload["part_count"])
        video.raw_s3_key = multipart["raw_s3_key"]
        video.multipart_upload_id = multipart["upload_id"]
        video.status = Video.Status.UPLOADING
        video.save(update_fields=["raw_s3_key", "multipart_upload_id", "status", "updated_at"])

        ProcessingJob.objects.get_or_create(video=video)

        return Response(
            {
                "video_id": str(video.id),
                "upload_id": multipart["upload_id"],
                "presigned_parts": multipart["presigned_parts"],
                "part_size_bytes": multipart["part_size_bytes"],
            },
            status=status.HTTP_201_CREATED,
        )


class CompleteUploadView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, video_id):
        serializer = CompleteUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist as exc:
            raise NotFound("Video not found.") from exc

        if serializer.validated_data["upload_id"] != video.multipart_upload_id:
            raise ValidationError("Upload ID does not match this video.")

        from apps.shared.storage import media_storage

        media_storage().complete_multipart_upload(
            key=video.raw_s3_key,
            upload_id=video.multipart_upload_id,
            parts=serializer.validated_data["parts"],
        )

        video.status = Video.Status.PROCESSING
        video.hls_base_path = hls_base_path(video)
        video.master_playlist = master_playlist_key(video)
        video.processing_error = ""
        video.save(update_fields=["status", "hls_base_path", "master_playlist", "processing_error", "updated_at"])

        job, _ = ProcessingJob.objects.get_or_create(video=video)
        job.status = ProcessingJob.Status.QUEUED
        job.current_step = "Queued for transcoding"
        job.progress_pct = 0
        job.error_log = ""
        job.save()

        try:
            initiate_transcoding.delay(str(video.id))
        except Exception as exc:
            video.status = Video.Status.FAILED
            video.processing_error = f"Processing queue submission failed: {exc}"
            video.save(update_fields=["status", "processing_error", "updated_at"])

            job.status = ProcessingJob.Status.FAILED
            job.current_step = "Queue submission failed"
            job.error_log = str(exc)
            job.save()

            return Response(
                {"detail": "Upload completed, but transcoding could not be queued."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"message": "Processing started", "job_id": str(job.id)},
            status=status.HTTP_202_ACCEPTED,
        )
