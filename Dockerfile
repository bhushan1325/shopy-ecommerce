# ==============================================================================
# SHOPY — Production Dockerfile (Spring Boot 4.x + Java 25)
# Multi-stage build for minimal production image size
# ==============================================================================

# Stage 1: Build the application JAR
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

# Copy Maven wrapper & POM
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and build
COPY src/ ./src/
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Runtime image
FROM eclipse-temurin:25-jre
WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Dynamic port assignment for cloud providers (Railway, Render, Cloud Run, AWS)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
