FROM alpine:3.19

ARG TARGETARCH
# minio's upstream binary is no longer downloadable, so we use the pgsty/silo fork.
ARG SILO_RELEASE=RELEASE.2026-09-03T13-18-01Z
ARG SILO_VERSION=20260903131801.0.0

RUN apk add --no-cache aws-cli curl && \
    curl -fsSL "https://github.com/pgsty/silo/releases/download/${SILO_RELEASE}/silo_${SILO_VERSION}_linux_${TARGETARCH}.tar.gz" -o /tmp/silo.tar.gz && \
    tar -xzf /tmp/silo.tar.gz -C /tmp silo && \
    mv /tmp/silo /usr/local/bin/minio && \
    rm /tmp/silo.tar.gz && \
    chmod +x /usr/local/bin/minio

COPY e2e-tests/images/start-minio-with-buckets /usr/local/bin/start-minio-with-buckets
COPY e2e-tests/fixtures/permissions/permissions.json /opt/minio-fixtures/permissions/permissions.json
COPY e2e-tests/fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings /opt/minio-fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings
COPY e2e-tests/fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings.public /opt/minio-fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings.public
COPY e2e-tests/fixtures/snapshots /opt/minio-fixtures/snapshots

RUN chmod +x /usr/local/bin/start-minio-with-buckets

EXPOSE 9000 9001

ENTRYPOINT ["/usr/local/bin/start-minio-with-buckets"]
