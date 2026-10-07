#!/usr/bin/env bash

set -euo pipefail

# Inside Docker, localhost points at this container, not the host machine.
export AWS_ENDPOINT_URL_S3="${AWS_ENDPOINT_URL_S3:-http://host.docker.internal:9002}"
export AWS_REGION="${AWS_REGION:-eu-west-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test-access-key-id}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test-secret-access-key}"

# Run the Vite dev server (port 5173) for hot module reloading. Play keeps port
# 9000 and serves the HTML, injecting the Vite client from /vite-dev/ (proxied to
# this server by nginx) when VITE_DEV_SERVER is set. VITE_PROXIED tells Vite to
# serve modules/HMR under /vite-dev/ over wss. Play's `sbt run` recompiles
# changed Scala sources on the next request.
export VITE_DEV_SERVER="/vite-dev"
export VITE_PROXIED="true"
npm run dev &

exec sbt -Dlocal=true run
