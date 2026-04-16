from __future__ import annotations

from django.conf import settings

from apps.shared.storage import media_storage

from .models import Video


def raw_video_key(video: Video) -> str:
    return f"raw/{video.id}/{video.source_filename}"


def hls_base_path(video: Video) -> str:
    return f"hls/{video.id}"


def master_playlist_key(video: Video) -> str:
    return f"{hls_base_path(video)}/master.m3u8"


def create_multipart_upload(video: Video, part_count: int) -> dict:
    key = raw_video_key(video)
    storage = media_storage()
    upload_id = storage.create_multipart_upload(key)
    presigned_parts = storage.generate_multipart_urls(
        key=key,
        upload_id=upload_id,
        part_numbers=range(1, part_count + 1),
    )
    return {
        "upload_id": upload_id,
        "raw_s3_key": key,
        "presigned_parts": [
            {"part_number": item.part_number, "upload_url": item.upload_url}
            for item in presigned_parts
        ],
        "part_size_bytes": settings.VIDEO_UPLOAD_PART_SIZE_BYTES,
    }


def signed_manifest_url(video: Video) -> str:
    return media_storage().generate_download_url(key=video.master_playlist)

