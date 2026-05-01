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
