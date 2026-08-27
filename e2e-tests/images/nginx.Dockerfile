# syntax=docker/dockerfile:1

# Stage 1: generate the pan-domain auth cookie using the project's existing
# TypeScript helper, so the cookie signing logic lives in one place.
FROM node:20-alpine AS cookie-builder
WORKDIR /build

# Only the packages needed to run the cookie generator, kept minimal so this
# stage stays fast and doesn't pull in webpack/playwright/etc.
RUN npm install --no-save @guardian/pan-domain-node@^1.2.4 tsx@^4.22.4

COPY e2e-tests/setup/panDomainCookie.ts e2e-tests/setup/panDomainKeys.ts ./e2e-tests/setup/
COPY e2e-tests/images/generate-pan-domain-cookie.ts ./e2e-tests/images/
RUN node_modules/.bin/tsx e2e-tests/images/generate-pan-domain-cookie.ts > /cookie.txt

# Stage 2: nginx serving the app proxy and the /cookie helper endpoint, with the
# cookie value baked into the config at build time.
FROM nginx:1.27-alpine
COPY --from=cookie-builder /cookie.txt /cookie.txt
COPY e2e-tests/images/nginx-dev.conf.template /etc/nginx/dev.conf.template
RUN export PAN_DOMAIN_COOKIE="$(cat /cookie.txt)" \
    && envsubst '${PAN_DOMAIN_COOKIE}' < /etc/nginx/dev.conf.template > /etc/nginx/conf.d/default.conf \
    && rm -f /cookie.txt /etc/nginx/dev.conf.template

# TLS is terminated by the host's dev-nginx, which proxies plain HTTP here, so
# this container serves HTTP only.
EXPOSE 80
