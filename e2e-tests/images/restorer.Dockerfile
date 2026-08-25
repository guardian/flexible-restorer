# syntax=docker/dockerfile:1
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV AWS_SDK_LOAD_CONFIG=1

# System dependencies needed for mise and for building native npm modules.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    g++ \
    make \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install mise and expose its binary and tool shims on PATH.
RUN curl https://mise.run | sh
ENV PATH="/root/.local/bin:/root/.local/share/mise/shims:${PATH}"

WORKDIR /app

# Install the toolchain (Java, Node, sbt, aws-cli, ...) pinned in .tool-versions.
# Layer-cached until .tool-versions changes.
COPY .tool-versions ./
RUN mise trust ./.tool-versions \
    && mise install \
    && mise reshim

# Pre-fetch JVM dependencies. Layer-cached after this point: only re-runs when
# build.sbt or project/ changes.
COPY build.sbt ./
COPY project ./project
RUN sbt -batch update

# Install npm dependencies. Only re-runs when package.json/lock changes.
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Compile Scala sources. Only re-runs when app/ or conf/ changes,
# not when JS, scripts, or fixtures change.
COPY app ./app
COPY conf ./conf
RUN sbt -batch compile

# Build frontend assets. Only re-runs when public/ or webpack config changes,
# not when Scala sources change.
COPY public ./public
COPY webpack.config.js ./
RUN npm run build

# Copy the startup script only. The application code (app/, conf/, public/,
# webpack.config.js) is baked above so the image is self-contained, but at
# runtime it is bind-mounted from the host (see
# e2e-tests/setup/stackContainers.ts) so code changes are watched and picked up
# without rebuilding the image.
COPY scripts ./scripts
RUN chmod +x /app/scripts/docker/docker-start

EXPOSE 9000

CMD ["/app/scripts/docker/docker-start"]
