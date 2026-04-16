from unittest.mock import MagicMock, patch

from django.test import RequestFactory, SimpleTestCase

from apps.streaming.services import render_playlist


class RenderPlaylistTests(SimpleTestCase):
    def setUp(self):
        self.request = RequestFactory().get("http://localhost:8001/api/v1/streaming/videos/test/playlist.m3u8")
        self.video = MagicMock()
        self.video.id = "a6b9315f-d44a-438d-8ab5-f11d78c0242c"
        self.video.hls_base_path = f"hls/{self.video.id}"
        self.video.master_playlist = f"{self.video.hls_base_path}/master.m3u8"

    @patch("apps.streaming.services.media_storage")
    def test_master_playlist_rewrites_child_manifest_to_signed_api_url(self, media_storage_mock):
        storage = media_storage_mock.return_value
        storage.read_text.return_value = "\n".join(
            [
                "#EXTM3U",
                '#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"',
                "720p/playlist.m3u8",
                "",
            ]
        )

        playlist = render_playlist(request=self.request, video=self.video, playlist_path="master.m3u8")

        self.assertIn("http://testserver/api/v1/streaming/videos/", playlist)
        self.assertIn("path=720p%2Fplaylist.m3u8", playlist)
        storage.generate_download_url.assert_not_called()

    @patch("apps.streaming.services.media_storage")
    def test_variant_playlist_rewrites_segments_to_presigned_object_urls(self, media_storage_mock):
        storage = media_storage_mock.return_value
        storage.read_text.return_value = "\n".join(
            [
                "#EXTM3U",
                "#EXTINF:5.0,",
                "seg0000.ts",
                "",
            ]
        )
        storage.generate_download_url.return_value = "http://localhost:9002/signed-segment.ts"

        playlist = render_playlist(request=self.request, video=self.video, playlist_path="720p/playlist.m3u8")

        self.assertIn("http://localhost:9002/signed-segment.ts", playlist)
        storage.generate_download_url.assert_called_once_with(
            key=f"{self.video.hls_base_path}/720p/seg0000.ts"
        )
