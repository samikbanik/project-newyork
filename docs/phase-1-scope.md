# Phase 1 Scope

## Goal

Stand up one clean upload-to-playback path for a small video streaming platform without having the API serve video bytes directly.

## Included

- Django API scaffold with JWT-oriented authentication
- Custom user model with `viewer` and `admin` roles
- Video and processing job models
- Admin upload initiation and completion endpoints
- Single-rendition HLS processing workflow (`720p`)
- React login, catalogue, player, and minimal admin upload route
- Signed playback URL generation
- Docker-based local development stack with Postgres, Redis, and MinIO

## Deferred

- Multi-rendition ABR playback
- Watch history and progress tracking
- Search, genres, and pagination
- Thumbnail extraction and admin dashboards
- SSO, observability, and performance hardening

## Implementation Notes

- The backend uses object storage for raw uploads and HLS output.
- Celery is responsible for asynchronous video processing.
- The frontend is intentionally light for Phase 1 and optimised for a working vertical slice.
- Containerization is part of the initial scaffold so local setup stays predictable.
