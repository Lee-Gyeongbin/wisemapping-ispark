################################################################################
# API 전용 이미지 - 소스에서 빌드 (호스트에 Maven 불필요)
# 사용: wisemapping-open-source 루트에서
#   docker build -f distribution/api/Dockerfile.from-source -t wisemapping-api .
################################################################################

################################################################################
# Stage 1: Build Backend JAR
################################################################################
FROM eclipse-temurin:24-jdk-alpine AS backend-builder
WORKDIR /build

RUN apk add --no-cache maven

COPY wise-api/pom.xml ./wise-api/
COPY wise-api/src ./wise-api/src/

WORKDIR /build/wise-api
RUN mvn clean package -DskipTests \
    -Dgit.branch=unknown \
    -Dgit.commit.id.abbrev=unknown \
    -Dgit.commit.id.full=unknown \
    -Dgit.commit.time=unknown

################################################################################
# Stage 2: Runtime
################################################################################
FROM eclipse-temurin:24-jre-alpine
LABEL maintainer="Paulo Gustavo Veiga <pveiga@wisemapping.com>"

ARG ENABLE_NEWRELIC=false

RUN addgroup -g 1001 -S wisemapping && \
    adduser -S -u 1001 -G wisemapping wisemapping

VOLUME /tmp
COPY --chown=wisemapping:wisemapping distribution/api/env-config.sh /app/config-gen.sh
COPY --from=backend-builder --chown=wisemapping:wisemapping /build/wise-api/target/wisemapping-api.jar /app/wisemapping-api.jar
# Windows 호스트에서 빌드 시 CRLF 제거 (그렇지 않으면 /app/config-gen.sh: not found 발생)
RUN sed -i 's/\r$//' /app/config-gen.sh && chmod +x /app/config-gen.sh

RUN mkdir -p /app && \
    if [ "$ENABLE_NEWRELIC" = "true" ]; then \
        apk add --no-cache curl && \
        curl -o /app/newrelic.jar https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar && \
        chown wisemapping:wisemapping /app/newrelic.jar && \
        apk del curl; \
    fi

WORKDIR /app
USER wisemapping

EXPOSE 8080

ENV JAVA_OPTS="-XX:InitialRAMPercentage=60 -XX:MaxRAMPercentage=60"

ENTRYPOINT ["sh", "-c", "/app/config-gen.sh && java ${JAVA_OPTS} ${NEW_RELIC_OPTS} -Dspring.config.additional-location=optional:file:/app/config/ -jar wisemapping-api.jar"]
