from __future__ import annotations

import posixpath
from urllib.parse import urlencode

from django.conf import settings
from django.core import signing
from django.http import Http404
from django.urls import reverse

from apps.shared.storage import media_storage
from apps.videos.models import Video


PLAYLIST_TOKEN_SALT = "streaming.playlist"


def build_playback_payload(*, request, video: Video) -> dict:
    return {
        "session_id": str(video.id),
        "manifest_url": build_playlist_url(request=request, video=video, playlist_path="master.m3u8"),
        "cookies": {},
    }


def build_playlist_url(*, request, video: Video, playlist_path: str) -> str:
    token = signing.dumps(
        {"video_id": str(video.id), "path": playlist_path},
        salt=PLAYLIST_TOKEN_SALT,
        compress=True,
    )
    query = urlencode({"path": playlist_path, "token": token})
    relative_url = reverse("streaming-playlist", kwargs={"video_id": video.id})
    return request.build_absolute_uri(f"{relative_url}?{query}")


def validate_playlist_token(*, video: Video, playlist_path: str, token: str) -> None:
    try:
        payload = signing.loads(
            token,
            salt=PLAYLIST_TOKEN_SALT,
            max_age=settings.AWS_PRESIGNED_EXPIRY,
        )
    except signing.BadSignature as exc:
        raise Http404("Playback is not available for this video.") from exc

    if payload.get("video_id") != str(video.id) or payload.get("path") != playlist_path:
        raise Http404("Playback is not available for this video.")


def render_playlist(*, request, video: Video, playlist_path: str) -> str:
    key = _playlist_storage_key(video=video, playlist_path=playlist_path)
    source = media_storage().read_text(key=key)

    if playlist_path == "master.m3u8":
        return _rewrite_playlist(
            source=source,
            playlist_path=playlist_path,
            uri_builder=lambda child_path: build_playlist_url(
                request=request,
                video=video,
                playlist_path=child_path,
            ),
        )

    return _rewrite_playlist(
        source=source,
        playlist_path=playlist_path,
        uri_builder=lambda child_path: media_storage().generate_download_url(
            key=f"{video.hls_base_path}/{child_path}"
        ),
    )


def _playlist_storage_key(*, video: Video, playlist_path: str) -> str:
    normalized_path = _resolve_playlist_path(base_path="master.m3u8", target=playlist_path)
    if normalized_path == "master.m3u8":
        return video.master_playlist
    return f"{video.hls_base_path}/{normalized_path}"


def _rewrite_playlist(*, source: str, playlist_path: str, uri_builder) -> str:
    rewritten_lines: list[str] = []
    for line in source.splitlines():
        stripped_line = line.strip()
        if not stripped_line or stripped_line.startswith("#"):
            rewritten_lines.append(line)
            continue

        resolved_path = _resolve_playlist_path(base_path=playlist_path, target=stripped_line)
        rewritten_lines.append(uri_builder(resolved_path))

    return "\n".join(rewritten_lines) + "\n"


def _resolve_playlist_path(*, base_path: str, target: str) -> str:
    base_dir = posixpath.dirname(base_path)
    normalized = posixpath.normpath(posixpath.join(base_dir, target)).lstrip("/")
    if normalized.startswith("../") or normalized == "..":
        raise Http404("Playback is not available for this video.")
    return normalized
