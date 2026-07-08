FROM alpine:3.19

# TARGETARCH is provided automatically by BuildKit (e.g. "arm64" on Apple
# Silicon, "amd64" on CI runners). MinIO's release paths use the same names, so
# this downloads the binary matching the build platform.
ARG TARGETARCH
RUN apk add --no-cache aws-cli curl && \
    curl -fsSL https://dl.min.io/server/minio/release/linux-${TARGETARCH}/minio -o /usr/local/bin/minio && \
    chmod +x /usr/local/bin/minio

COPY scripts/docker/start-minio-with-buckets /usr/local/bin/start-minio-with-buckets
COPY fixtures/permissions/permissions.json /opt/minio-fixtures/permissions/permissions.json
COPY fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings /opt/minio-fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings
COPY fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings.public /opt/minio-fixtures/pan-domain-settings/local.dev-gutools.co.uk.settings.public
COPY fixtures/snapshots /opt/minio-fixtures/snapshots

RUN chmod +x /usr/local/bin/start-minio-with-buckets

EXPOSE 9000 9001

ENTRYPOINT ["/usr/local/bin/start-minio-with-buckets"]
