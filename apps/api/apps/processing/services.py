from __future__ import annotations

from pathlib import Path
import shutil
import subprocess

from django.conf import settings

from apps.shared.storage import media_storage
from apps.videos.models import Video
from apps.videos.services import master_playlist_key


RENDITION_HEIGHT = 720
RENDITION_WIDTH = 1280
RENDITION_BITRATE = "2500k"


def _write_master_playlist(output_dir: Path) -> Path:
    playlist_path = output_dir / "master.m3u8"
    playlist_path.write_text(
        "\n".join(
            [
                "#EXTM3U",
                "#EXT-X-VERSION:3",
                '#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"',
                "720p/playlist.m3u8",
                "",
            ]
        ),
        encoding="utf-8",
    )
    return playlist_path


def _ffmpeg_command(input_path: Path, rendition_dir: Path) -> list[str]:
    return [
        "ffmpeg",
        "-i",
        str(input_path),
        "-vf",
        f"scale={RENDITION_WIDTH}:{RENDITION_HEIGHT}",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-b:v",
        RENDITION_BITRATE,
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ac",
        "2",
        "-hls_time",
        str(settings.HLS_SEGMENT_DURATION),
        "-hls_playlist_type",
        "vod",
        "-hls_segment_filename",
        str(rendition_dir / "seg%04d.ts"),
        "-hls_flags",
        "independent_segments",
        str(rendition_dir / "playlist.m3u8"),
    ]


def transcode_video(video: Video) -> None:
    storage = media_storage()
    workdir = settings.TRANSCODE_WORKDIR / str(video.id)
    if workdir.exists():
        shutil.rmtree(workdir)
    raw_dir = workdir / "raw"
    output_dir = workdir / "output"
    rendition_dir = output_dir / "720p"
    raw_dir.mkdir(parents=True, exist_ok=True)
    rendition_dir.mkdir(parents=True, exist_ok=True)

    input_path = raw_dir / video.source_filename
    storage.download_file(key=video.raw_s3_key, destination=str(input_path))

    subprocess.run(_ffmpeg_command(input_path, rendition_dir), check=True)
    master_path = _write_master_playlist(output_dir)

    for file_path in output_dir.rglob("*"):
        if not file_path.is_file():
            continue
        relative_path = file_path.relative_to(output_dir)
        key = f"{video.hls_base_path}/{relative_path.as_posix()}"
        content_type = "application/vnd.apple.mpegurl" if file_path.suffix == ".m3u8" else "video/mp2t"
        storage.upload_file(source=str(file_path), key=key, content_type=content_type)

    if not video.master_playlist:
        video.master_playlist = master_playlist_key(video)

    shutil.rmtree(workdir, ignore_errors=True)

