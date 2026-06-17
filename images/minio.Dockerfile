FROM alpine:3.19

RUN apk add --no-cache aws-cli curl && \
    curl -fsSL https://dl.min.io/server/minio/release/linux-arm64/minio -o /usr/local/bin/minio && \
    chmod +x /usr/local/bin/minio

COPY scripts/start-minio-with-buckets /usr/local/bin/start-minio-with-buckets
COPY fixtures/permissions.json /opt/minio-fixtures/permissions.json
COPY fixtures/local.dev-gutools.co.uk.settings /opt/minio-fixtures/local.dev-gutools.co.uk.settings
COPY fixtures/local.dev-gutools.co.uk.settings.public /opt/minio-fixtures/local.dev-gutools.co.uk.settings.public

RUN chmod +x /usr/local/bin/start-minio-with-buckets

EXPOSE 9000 9001

ENTRYPOINT ["/usr/local/bin/start-minio-with-buckets"]
