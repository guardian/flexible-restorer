#!/usr/bin/env bash

set -euo pipefail

# Inside Docker, localhost points at this container, not the host machine.
export AWS_ENDPOINT_URL_S3="${AWS_ENDPOINT_URL_S3:-http://host.docker.internal:9002}"
export AWS_REGION="${AWS_REGION:-eu-west-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test-access-key-id}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test-secret-access-key}"

# Work around sporadic Graal/JVMCI compilation assertion failures in this Docker runtime.
# Prefer SBT_OPTS here so these JVM flags apply directly to the sbt JVM process.
export SBT_OPTS="${SBT_OPTS:+$SBT_OPTS }-J-XX:+UnlockExperimentalVMOptions -J-XX:-UseJVMCICompiler -Dgraal.CompilationFailureAction=Silent"

# Rebuild the frontend from the bind-mounted source on change, so host edits are
# picked up without rebuilding the image. Play's `sbt run` recompiles changed
# Scala sources on the next request in the same way.
npm run dev &

exec sbt -Dlocal=true run
