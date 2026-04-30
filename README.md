# LinkedIn Scraper Monorepo

This repository now contains the LinkedIn scraper Chrome extension and the backend service scaffold in a single monorepo.

## Structure

- `apps/extension` - Manifest V3 Chrome extension for collecting LinkedIn profile fragments
- `apps/backend` - Spring Boot backend scaffold prepared for Docker, GraalVM, and SQLite
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

The backend is intentionally scaffold-only for now:

- ✅ Monorepo structure with Maven aggregator
- ✅ Maven Wrapper for reproducible builds (`./mvnw` works locally and in Docker)
- ✅ Backend tests passing (`BUILD SUCCESS`)
- ✅ Docker multi-stage build configured (GraalVM native-image ready)
- ✅ SQLite datasource configuration in place
- ✅ Spring Boot 3 + Java 21 setup
- ✅ Profile API endpoints stubbed (return `501 Not Implemented`)
- ✅ OpenAPI contract in `apps/backend/openapi.yaml`

Next steps:

1. Wire SQLite persistence layer (JDBC, schema setup).
2. Implement profile CRUD endpoints against SQLite.
3. Add extension-to-backend synchronization logic.
4. Test Docker native build end-to-end.
