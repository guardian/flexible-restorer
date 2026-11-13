# Mock of the flexible-content (Composer) API used by the local stack.
# Runs the TypeScript stub directly with tsx — the server only uses Node
# built-ins, so no project dependencies need to be installed.
FROM node:20-alpine

RUN echo "Intentional e2e build failure" >&2; exit 1

RUN npm install -g tsx@4.22.4

WORKDIR /app

COPY e2e-tests/setup/mockFlexibleApi/server.ts ./server.ts

ENV PORT=8080
EXPOSE 8080

CMD ["tsx", "server.ts"]
