# LinkedIn Scraper Monorepo

This repository contains the LinkedIn scraper Chrome extension and a Spring Boot backend service in a single monorepo.

## Structure

- `apps/extension` - Manifest V3 Chrome extension for collecting LinkedIn profile fragments
- `apps/backend` - Spring Boot backend prepared for Docker, GraalVM, and SQLite
- `data` - local runtime directory for SQLite files when the backend runs in Docker Compose

## Backend Stack

- Java 21
- Spring Boot
- Docker
- GraalVM native-image build pipeline
- SQLite in a single file

## Quick Start

### Extension

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select `apps/extension`.

### Backend

Local build (Maven Wrapper included, no pre-install required):

```bash
./mvnw -pl apps/backend test
./mvnw -pl apps/backend spring-boot:run
./mvnw -pl apps/backend -Pnative -DskipTests native:compile
```

Docker Compose (multi-stage GraalVM native build):

```bash
docker compose up --build backend
```

The backend runs on `http://localhost:8080` with Swagger UI at `/swagger-ui.html` and health check at `/actuator/health`.

SQLite database file is stored in `./data/linkedin-scraper.sqlite` when using Docker Compose.

## Current Status

Implemented and verified so far:

- ✅ Monorepo structure with Maven aggregator
- ✅ Maven Wrapper for reproducible builds (`./mvnw` works locally and in Docker)
- ✅ Backend tests passing (`BUILD SUCCESS`)
- ✅ Docker multi-stage build configured (GraalVM native-image ready)
- ✅ SQLite datasource configuration in place
- ✅ Spring Boot 3 + Java 21 setup
- ✅ SQLite-backed profile API endpoints implemented (`/profiles`, `/export`, field + experiences operations)
- ✅ OpenAPI contract in `apps/backend/openapi.yaml`

Validated runtime checks:

- ✅ `/actuator/health` returns `UP`
- ✅ `/swagger-ui.html` available (redirects to `/swagger-ui/index.html`)
- ✅ `/api-docs` responds with HTTP `200`

Next steps:

1. Add extension-to-backend synchronization logic.
2. Add endpoint integration tests for profile CRUD/export paths.
3. Add schema migration strategy (Flyway/Liquibase) for future DB changes.
