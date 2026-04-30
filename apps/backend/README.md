# Backend Scaffold

This module contains the first backend scaffold for the LinkedIn scraper plugin.

## Included

- Spring Boot 3 application skeleton
- API controller stubs for the planned profile endpoints
- SQLite datasource configuration for a single-file database
- Springdoc / Swagger UI integration
- GraalVM native-image Maven plugin
- Dockerfile for native container builds

## Useful Commands

```bash
mvn -pl apps/backend test
mvn -pl apps/backend spring-boot:run
mvn -pl apps/backend -Pnative -DskipTests native:compile
```

## Runtime Notes

- Default port: `8080`
- Default SQLite file: `./data/linkedin-scraper.sqlite`
- Swagger UI: `/swagger-ui.html`
- Health endpoint: `/actuator/health`

The API methods are scaffold-only and currently return `501 Not Implemented` until persistence is wired.
