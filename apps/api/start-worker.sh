#!/bin/sh
set -eu

celery -A config worker --loglevel=INFO

