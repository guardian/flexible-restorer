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
    nginx \
    openssl \
    scala \
    && rm -rf /var/lib/apt/lists/*

# Install sbt launcher.
RUN curl -fsSL https://raw.githubusercontent.com/dwijnand/sbt-extras/master/sbt -o /usr/local/bin/sbt \
    && chmod +x /usr/local/bin/sbt

WORKDIR /app

# Copy SBT build definition first so dependency resolution can be cached across
# source changes.
COPY build.sbt ./
COPY project ./project

# Pre-fetch JVM dependencies/plugins in a cacheable layer.
RUN sbt -batch update

# Use the exact Node version family from .nvmrc for frontend build.
COPY .nvmrc .
RUN rm -rf "$NVM_DIR" \
    && git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR" \
    && cd "$NVM_DIR" \
    && git checkout v0.40.1 \
    && bash -lc 'set -eo pipefail; export NVM_DIR=/usr/local/nvm; . "$NVM_DIR/nvm.sh"; NODE_VERSION="$(tr -d "[:space:]" < /app/.nvmrc)"; nvm install "$NODE_VERSION"; nvm alias default "$NODE_VERSION"; nvm use default; NODE_BIN_DIR="$(dirname "$(nvm which default)")"; ln -sf "$NODE_BIN_DIR/node" /usr/local/bin/node; ln -sf "$NODE_BIN_DIR/npm" /usr/local/bin/npm; ln -sf "$NODE_BIN_DIR/npx" /usr/local/bin/npx'

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Compile Scala sources during image build so runtime startup does not need a
# full cold compile when build inputs are unchanged.
RUN sbt -batch compile
RUN chmod +x /app/scripts/docker-start

COPY images/dev-nginx /usr/local/bin/dev-nginx
RUN chmod +x /usr/local/bin/dev-nginx

EXPOSE 80 443 9000

CMD ["/app/scripts/docker-start"]
