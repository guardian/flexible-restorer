# syntax=docker/dockerfile:1
FROM eclipse-temurin:11-jdk

ENV DEBIAN_FRONTEND=noninteractive
ENV NVM_DIR=/usr/local/nvm
ENV AWS_SDK_LOAD_CONFIG=1

# Install system dependencies and Scala.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    bash \
    git \
    awscli \
    openssl \
    scala \
    && rm -rf /var/lib/apt/lists/*

# Install sbt launcher.
RUN curl -fsSL https://raw.githubusercontent.com/dwijnand/sbt-extras/master/sbt -o /usr/local/bin/sbt \
    && chmod +x /usr/local/bin/sbt

WORKDIR /app

# Pre-fetch JVM dependencies. Layer-cached after this point: only re-runs when
# build.sbt or project/ changes.
COPY build.sbt ./
COPY project ./project
RUN sbt -batch update

# Install Node via nvm. Only re-runs when .tool-versions changes.
# The Node version is read from .tool-versions (the same file mise uses locally).
COPY .tool-versions .
RUN rm -rf "$NVM_DIR" \
    && git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR" \
    && cd "$NVM_DIR" \
    && git checkout v0.40.1 \
    && bash -lc 'set -eo pipefail; export NVM_DIR=/usr/local/nvm; . "$NVM_DIR/nvm.sh"; NODE_VERSION="$(awk "/^node /{print \$2}" /app/.tool-versions)"; nvm install "$NODE_VERSION"; nvm alias default "$NODE_VERSION"; nvm use default; NODE_BIN_DIR="$(dirname "$(nvm which default)")"; ln -sf "$NODE_BIN_DIR/node" /usr/local/bin/node; ln -sf "$NODE_BIN_DIR/npm" /usr/local/bin/npm; ln -sf "$NODE_BIN_DIR/npx" /usr/local/bin/npx'

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
RUN node_modules/.bin/webpack --mode=production

# Copy remaining runtime files (scripts, fixtures, nginx config, etc.).
COPY . .
RUN chmod +x /app/scripts/docker/docker-start

EXPOSE 9000

CMD ["/app/scripts/docker/docker-start"]
