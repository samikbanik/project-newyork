from django.http import Http404, HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.videos.models import Video

from .services import render_playlist, validate_playlist_token


class PlaylistView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, video_id):
        playlist_path = request.query_params.get("path", "")
        token = request.query_params.get("token", "")

        if not playlist_path.endswith(".m3u8") or not token:
            raise Http404("Playback is not available for this video.")

        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist as exc:
            raise Http404("Playback is not available for this video.") from exc

        if video.status != Video.Status.READY or not video.master_playlist or not video.hls_base_path:
            raise Http404("Playback is not available for this video.")

        validate_playlist_token(video=video, playlist_path=playlist_path, token=token)
        playlist = render_playlist(request=request, video=video, playlist_path=playlist_path)
        response = HttpResponse(playlist, content_type="application/vnd.apple.mpegurl")
        response["Cache-Control"] = "no-store"
        return response
