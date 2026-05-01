# Upgrade Plan: linkedinscraper-monorepo (e7f3a2b1-c4d5-4e6f-87a9-1b2c3d4e5f60)

- **Generated**: 2026-05-01 (current session)
- **HEAD Branch**: main
- **HEAD Commit ID**: b4117db

## Available Tools

**JDKs**
- JDK 21.0.10: /usr/lib/jvm/java-21-openjdk-amd64 (current project JDK, used by step 2)
- JDK 25: **<TO_BE_INSTALLED>** (required by steps 3–6)

**Build Tools**
- Maven Wrapper: 3.6.3 → **<TO_BE_UPGRADED>** to 4.0.x (Maven 3.6.x does not support Java 25; Maven 4.0+ required)

## Guidelines

> Note: You can add any specific guidelines or constraints for the upgrade process here if needed, bullet points are preferred.

## Options

- Working branch: appmod/java-upgrade-e7f3a2b1-c4d5-4e6f-87a9-1b2c3d4e5f60
- Run tests before and after the upgrade: true

## Upgrade Goals

- Java: 21 → **25 (latest LTS)**

## Technology Stack

| Technology/Dependency         | Current    | Min Compatible | Why Incompatible                                        |
| ----------------------------- | ---------- | -------------- | ------------------------------------------------------- |
| Java                          | 21         | 25             | User requested latest LTS                               |
| Spring Boot                   | 3.4.5      | 3.4.5          | Already compatible with Java 25                         |
| Maven (wrapper)               | 3.6.3      | 4.0.0          | Maven 3.6.x does not support Java 25 compilation        |
| native-maven-plugin           | 0.10.3     | 0.10.3         | Compatible; GraalVM image tag updated in Dockerfile     |
| springdoc-openapi             | 2.8.6      | 2.8.6          | Compatible                                              |
| sqlite-jdbc                   | 3.49.1.0   | 3.49.1.0       | Compatible                                              |
| GraalVM Docker image          | 21-ol9     | 25-ol9         | Dockerfile references Java 21 image tag                 |

## Derived Upgrades

- **Maven Wrapper → 4.0.x**: Maven 3.6.x does not support Java 25 as the compiler JDK; Maven 4.0+ is required.
- **Dockerfile GraalVM image tag**: `ghcr.io/graalvm/native-image-community:21-ol9` → `ghcr.io/graalvm/native-image-community:25-ol9` to match the target Java version in the native build stage.
- **`java.version` property**: Update from `21` to `25` in `apps/backend/pom.xml`.

## Upgrade Steps

- Step 1: Setup Environment — Install JDK 25
  - **Rationale**: JDK 25 is not yet installed; all subsequent compilation steps require it.
  - **Changes to Make**:
    - Install `openjdk-25-jdk` via apt
  - **Verification**: `java -version` with JDK 25; expected `openjdk version "25"`.

- Step 2: Setup Baseline — Compile and test with current JDK 21
  - **Rationale**: Establish baseline pass rate for acceptance criteria before making any changes.
  - **Changes to Make**: None (read-only step)
  - **Verification**: `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw clean test -pl apps/backend -q`; expected BUILD SUCCESS.

- Step 3: Upgrade Maven Wrapper to 4.0.x
  - **Rationale**: Maven 3.6.3 is incompatible with Java 25 as the compiler JDK; upgrading the wrapper is required before switching the JDK.
  - **Changes to Make**:
    - Update `.mvn/wrapper/maven-wrapper.properties` `distributionUrl` to Maven 4.0.x
    - Update `wrapperVersion` accordingly
  - **Verification**: `JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64 ./mvnw --version`; expected Maven 4.0.x.

- Step 4: Upgrade Java version to 25
  - **Rationale**: Update `java.version` in `apps/backend/pom.xml` so the compiler plugin targets Java 25 bytecode.
  - **Changes to Make**:
    - Set `<java.version>25</java.version>` in `apps/backend/pom.xml`
  - **Verification**: `JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64 ./mvnw clean test-compile -pl apps/backend -q`; expected BUILD SUCCESS.

- Step 5: Update Dockerfile for Java 25
  - **Rationale**: The Docker native build stage references the GraalVM Java 21 community image; it must be updated to the Java 25 equivalent.
  - **Changes to Make**:
    - Change `FROM ghcr.io/graalvm/native-image-community:21-ol9` to `FROM ghcr.io/graalvm/native-image-community:25-ol9`
  - **Verification**: Review Dockerfile change; Docker build verification deferred (requires Docker daemon; out of scope for this CI run).

- Step 6: Final Validation — Full test suite with Java 25
  - **Rationale**: Verify all upgrade goals met, 100% test pass rate, no regressions.
  - **Changes to Make**: Fix any test failures discovered.
  - **Verification**: `JAVA_HOME=/usr/lib/jvm/java-25-openjdk-amd64 ./mvnw clean test -pl apps/backend`; expected BUILD SUCCESS with all tests passing.

## Key Challenges

- **Maven 4.0 API changes**: Maven 4.0 introduced some POM model changes. Spring Boot's `spring-boot-starter-parent` is used as the parent POM, so Maven 4.0 compatibility depends on the parent POM structure being valid.
  - **Strategy**: Run compilation after wrapper upgrade; fix any POM validation warnings from Maven 4.x if they appear.
- **GraalVM native-image for Java 25**: The community image for Java 25 (`ghcr.io/graalvm/native-image-community:25-ol9`) must exist on GHCR. If not available, the Dockerfile update will fall back to a Temurin-based GraalVM approach.
  - **Strategy**: Update Dockerfile tag; Docker build itself is not part of this CI run and is deferred to the Docker environment.
