# project-newyork

Phase 1 of a small video streaming platform built from the supplied architecture.

This repository is a monorepo with:

- `apps/api` for Django, DRF, Celery, and the media pipeline
- `apps/web` for the React application
- `infra` for local container and environment support
- `docs` for project planning notes

Phase 1 targets a thin, working flow:

- viewer registration and login
- admin video creation and upload completion
- single-rendition HLS processing (`720p`)
- published catalogue listing
- signed playback URL generation

Deferred to later phases:

- adaptive bitrate ladders
- watch history and resume
- search, genres, and pagination
- dashboard polish and thumbnails
- SSO, analytics, and scaling work

## Stack

- Backend: Django, Django REST Framework, Simple JWT, Celery
- Frontend: React, TypeScript, Vite, HLS.js
- Local infrastructure: Docker Compose, Postgres, Redis, MinIO

## Requirements

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) (Compose V2: `docker compose`)

All application services run in containers; you do not need Python or Node installed on the host for the default workflow.

## Installation

1. Clone this repository and change into the project root.

2. Create a local environment file from the example:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` if you need to change secrets, database credentials, or URLs. For local Docker usage, the values in `.env.example` are aligned with `docker-compose.yml` (service hostnames such as `postgres`, `redis`, and `minio` are correct inside the Compose network).

## Build and start services

From the repository root, build images and start every service (Postgres, Redis, MinIO, API, Celery worker, web dev server):

```bash
docker compose up --build
```

On first start (and when API code changes migrations), the API container runs Django `makemigrations` and `migrate` before `runserver`. The web service runs `npm install` then `npm run dev`.

**Detached mode** (containers keep running in the background):

```bash
docker compose up --build -d
```

**Stop** the stack:

```bash
docker compose down
```

To remove named volumes as well (wipes Postgres and MinIO data):

```bash
docker compose down -v
```

**Rebuild** after Dockerfile or dependency changes without cache (optional):

```bash
docker compose build --no-cache
docker compose up
```

**Logs** for a specific service:

```bash
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web
```

## Service URLs (local)

| Service | URL |
|--------|-----|
| Web app (Vite dev) | http://localhost:5174 |
| Django API | http://localhost:8001 |
| API (versioned routes) | http://localhost:8001/api/v1 |
| MinIO S3 API | http://localhost:9002 |
| MinIO Console | http://localhost:9003 |

Internal-only services (Postgres, Redis) are not published to the host by default; the API and worker connect to them using the hostnames in `.env`.

## What Is Implemented

- JWT-oriented auth endpoints and a custom user model with `viewer` and `admin` roles
- Video and processing job models for the Phase 1 ingestion path
- Admin upload initiation and completion endpoints backed by presigned multipart upload URLs
- A Celery task skeleton that downloads raw media, creates a single `720p` HLS rendition, and uploads playlists and segments back to object storage
- A React application with login, catalogue, watch, and admin upload routes
- A Dockerised local stack for API, worker, frontend, Postgres, Redis, and MinIO

## Current Constraints

- Dependencies are declared but were not installed in this sandbox session
- Django migrations have not been generated yet
- The transcoding path assumes `ffmpeg` is available in the API/worker container
- Watch history, search, genres, ABR, thumbnails, and admin polish are still intentionally deferred
