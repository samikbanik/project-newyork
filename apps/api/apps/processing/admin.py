from django.contrib import admin

from .models import ProcessingJob


@admin.register(ProcessingJob)
class ProcessingJobAdmin(admin.ModelAdmin):
    list_display = ("video", "status", "progress_pct", "current_step", "updated_at")
    list_filter = ("status",)
    search_fields = ("video__title", "current_step")

