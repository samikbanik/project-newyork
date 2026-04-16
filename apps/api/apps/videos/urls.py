from django.urls import path

from .views import PlaybackUrlView, VideoDetailView, VideoListView


urlpatterns = [
    path("", VideoListView.as_view(), name="video-list"),
    path("<uuid:id>/", VideoDetailView.as_view(), name="video-detail"),
    path("<uuid:video_id>/playback-url/", PlaybackUrlView.as_view(), name="video-playback-url"),
]

