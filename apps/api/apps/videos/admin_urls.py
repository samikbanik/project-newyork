from django.urls import path

from .views import CompleteUploadView, InitiateUploadView


urlpatterns = [
    path("", InitiateUploadView.as_view(), name="admin-video-initiate-upload"),
    path("<uuid:video_id>/complete-upload/", CompleteUploadView.as_view(), name="admin-video-complete-upload"),
]

