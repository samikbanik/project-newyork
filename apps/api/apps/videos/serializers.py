from rest_framework import serializers

from .models import Video


class VideoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = (
            "id",
            "title",
            "description",
            "thumbnail_url",
            "duration_secs",
            "content_rating",
            "release_year",
            "published_at",
        )


class VideoDetailSerializer(VideoListSerializer):
    available_qualities = serializers.SerializerMethodField()

    class Meta(VideoListSerializer.Meta):
        fields = VideoListSerializer.Meta.fields + ("available_qualities",)

    def get_available_qualities(self, obj: Video):
        return ["720p"] if obj.status == Video.Status.READY else []


class InitiateUploadSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True)
    content_rating = serializers.CharField(max_length=10)
    release_year = serializers.IntegerField(min_value=1888, max_value=3000)
    filename = serializers.CharField(max_length=255)
    file_size_bytes = serializers.IntegerField(min_value=1)
    part_count = serializers.IntegerField(min_value=1, max_value=10_000)


class CompletedPartSerializer(serializers.Serializer):
    part_number = serializers.IntegerField(min_value=1)
    etag = serializers.CharField(max_length=255)


class CompleteUploadSerializer(serializers.Serializer):
    upload_id = serializers.CharField(max_length=255)
    parts = CompletedPartSerializer(many=True)

