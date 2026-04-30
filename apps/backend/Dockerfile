FROM ghcr.io/graalvm/native-image-community:21-ol9 AS build

RUN microdnf install -y maven findutils tar gzip && microdnf clean all

WORKDIR /workspace
COPY pom.xml ./pom.xml
COPY src ./src
RUN mvn -Pnative -DskipTests native:compile

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /workspace/target/linkedin-scraper-backend /app/backend

EXPOSE 8080
ENTRYPOINT ["/app/backend"]
