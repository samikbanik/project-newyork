from django.urls import path

from .views import PlaylistView


urlpatterns = [
    path("videos/<uuid:video_id>/playlist.m3u8", PlaylistView.as_view(), name="streaming-playlist"),
]
