#!/bin/sh
set -eu

until /usr/bin/mc alias set local http://minio:9000 "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY"; do
  sleep 2
done

/usr/bin/mc mb --ignore-existing "local/$AWS_STORAGE_BUCKET_NAME"
/usr/bin/mc anonymous set none "local/$AWS_STORAGE_BUCKET_NAME"
/usr/bin/mc cors set local/"$AWS_STORAGE_BUCKET_NAME" /infra/minio-cors.xml
