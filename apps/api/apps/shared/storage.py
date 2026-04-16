from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import boto3
from botocore.client import Config
from django.conf import settings


@dataclass
class PresignedPart:
    part_number: int
    upload_url: str


class MediaStorage:
    def __init__(self):
        self.bucket = settings.AWS_STORAGE_BUCKET_NAME
        self.client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            verify=settings.AWS_S3_VERIFY,
            config=Config(signature_version="s3v4"),
        )
        self.public_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_S3_PUBLIC_ENDPOINT,
            verify=settings.AWS_S3_VERIFY,
            config=Config(signature_version="s3v4"),
        )

    def create_multipart_upload(self, key: str) -> str:
        response = self.client.create_multipart_upload(Bucket=self.bucket, Key=key)
        return response["UploadId"]

    def generate_multipart_urls(
        self,
        *,
        key: str,
        upload_id: str,
        part_numbers: Iterable[int],
        expires_in: int | None = None,
    ) -> list[PresignedPart]:
        expiry = expires_in or settings.AWS_PRESIGNED_EXPIRY
        return [
            PresignedPart(
                part_number=part_number,
                upload_url=self.public_client.generate_presigned_url(
                    "upload_part",
                    Params={
                        "Bucket": self.bucket,
                        "Key": key,
                        "UploadId": upload_id,
                        "PartNumber": part_number,
                    },
                    ExpiresIn=expiry,
                ),
            )
            for part_number in part_numbers
        ]

    def complete_multipart_upload(self, *, key: str, upload_id: str, parts: list[dict]) -> None:
        self.client.complete_multipart_upload(
            Bucket=self.bucket,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={
                "Parts": [
                    {
                        "PartNumber": part["part_number"],
                        "ETag": part["etag"],
                    }
                    for part in parts
                ]
            },
        )

    def download_file(self, *, key: str, destination: str) -> None:
        self.client.download_file(self.bucket, key, destination)

    def upload_file(self, *, source: str, key: str, content_type: str | None = None) -> None:
        extra_args = {"ContentType": content_type} if content_type else None
        self.client.upload_file(source, self.bucket, key, ExtraArgs=extra_args or {})

    def upload_bytes(self, *, payload: bytes, key: str, content_type: str) -> None:
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=payload,
            ContentType=content_type,
        )

    def read_text(self, *, key: str) -> str:
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        body = response["Body"].read()
        return body.decode("utf-8")

    def generate_download_url(self, *, key: str, expires_in: int | None = None) -> str:
        expiry = expires_in or settings.AWS_PRESIGNED_EXPIRY
        return self.public_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expiry,
        )


def media_storage() -> MediaStorage:
    return MediaStorage()
