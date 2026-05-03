# Backend Service

This module contains the Spring Boot backend for the LinkedIn scraper plugin.

## Included

- Spring Boot 3 application
- Implemented profile storage API backed by SQLite
- SQLite datasource configuration for a single-file database
- Springdoc / Swagger UI integration
- GraalVM native-image Maven plugin
- Dockerfile for native container builds

## Useful Commands

```bash
./mvnw -pl apps/backend test
./mvnw -pl apps/backend spring-boot:run
./mvnw -pl apps/backend -Pnative -DskipTests native:compile
```

## Build

Run these commands from the repository root:

```bash
# Compile + run tests for backend module
./mvnw -pl apps/backend clean test

# Build executable Spring Boot jar
./mvnw -pl apps/backend -DskipTests package

# Optional: native binary build (requires GraalVM native-image toolchain)
./mvnw -pl apps/backend -Pnative -DskipTests native:compile
```

## Docker Image

Build the backend image (multi-stage Dockerfile in this module):

```bash
docker build -f apps/backend/Dockerfile -t linkedin-scraper-backend:local apps/backend
```

Run the image on port `8080` and persist SQLite data to the repository `data` directory:

```bash
docker run --rm -p 8080:8080 -v "$(pwd)/data:/data" linkedin-scraper-backend:local
```

Alternative with Docker Compose from repository root:

```bash
docker compose up --build backend
```

## Runtime Notes

- Default port: `8080`
- Default SQLite file: `../../data/linkedin-scraper.sqlite`
- Swagger UI: `/swagger-ui.html`
- Health endpoint: `/actuator/health`
- OpenAPI docs endpoint: `/api-docs`

Implemented endpoints:

- `GET /profiles`
- `GET /profiles/{profileUrl}`
- `DELETE /profiles/{profileUrl}`
- `PUT /profiles/{profileUrl}/fields/{fieldName}`
- `DELETE /profiles/{profileUrl}/fields/{fieldName}`
- `POST /profiles/{profileUrl}/experiences`
- `DELETE /profiles/{profileUrl}/experiences`
- `DELETE /profiles/{profileUrl}/experiences/{index}`
- `GET /export`

Request note:

- The `{profileUrl}` path parameter should be URL-encoded; in practice, double-encoding is recommended for robust routing through path segments.
