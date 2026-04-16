from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/django/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/videos/", include("apps.videos.urls")),
    path("api/v1/admin/videos/", include("apps.videos.admin_urls")),
    path("api/v1/streaming/", include("apps.streaming.urls")),
]
