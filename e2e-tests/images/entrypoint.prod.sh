#!/usr/bin/env bash

set -euo pipefail

# Inside Docker, localhost points at this container. Respect values injected by
# the local stack (e.g. AWS_ENDPOINT_URL_S3=http://minio:9000); fall back to the
# host otherwise.
export AWS_ENDPOINT_URL_S3="${AWS_ENDPOINT_URL_S3:-http://host.docker.internal:9002}"
export AWS_REGION="${AWS_REGION:-eu-west-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test-access-key-id}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test-secret-access-key}"

# Build the production frontend (content-hashed assets + manifest) from the
# bind-mounted source, then stage and run the app in Play Prod mode so assets are
# served exactly as in production: read from the packaged classpath and returned
# with the immutable Cache-Control header (which Play only applies in Prod).
npm run build

sbt -batch stage

# The staged launcher name follows the project name; resolve it rather than
# hard-coding so a rename can't silently break this.
BIN="$(find target/universal/stage/bin -maxdepth 1 -type f ! -name '*.bat' | head -n1)"

exec "$BIN" \
  -Dplay.http.secret.key="${PLAY_SECRET:-local-prod-mode-secret-not-for-real-use-0123456789}" \
  -Dhttp.port=9000 \
  -Dlocal=true
