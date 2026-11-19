# Local dev / e2e container stack

These images make up the containerised Restorer stack used by the e2e suite and
by `npm run dev:local`. They are orchestrated by
[`../setup/stackContainers.ts`](../setup/stackContainers.ts) via Testcontainers.

The main app uses `ApplicationContainer` from `@guardian/end-to-end-testing`.
It exposes port `9000` and waits up to ten minutes for HTTP 200 from
`/management/healthcheck`. The stack adds the Vite port, mounts, environment and
dev/prod startup command. It uses the shared application image pinned in
[`../setup/stackContainers.ts`](../setup/stackContainers.ts) by commit and digest;
there is no Restorer image build or `E2E_RESTORER_IMAGE` override.

The repository is bind-mounted at `/app`. The common entrypoint installs the
repository's pinned Java, Node and sbt versions with mise, then runs `npm ci`
before starting the selected dev/prod entrypoint. Dependencies, build outputs
and test logs use container-local tmpfs mounts so parallel runs do not overwrite
host artifacts. Local development can still write logs to the host via `mountLogs`.
Cold starts need network access to download the toolchain and dependencies.

## How traffic flows

```mermaid
flowchart TB
    subgraph host["Host machine"]
        browser["Browser"]
        devnginx["dev-nginx\nTLS termination (mkcert)\nrestorer.local.dev-gutools.co.uk"]

        subgraph devcontainer["Devcontainer (Docker-in-Docker)"]
            subgraph stack["Testcontainers network"]
                nginx["nginx container (this dir)\nlisten :80\n/cookie sets prebaked pan-domain cookie\nproxies everything else"]
                restorer["restorer container\nPlay app via sbt run :9000"]
                localstack["localstack container\nS3 fixtures: pan-domain keys,\npermissions, snapshots"]
            end
        end
    end

    browser -->|"https://restorer.local.dev-gutools.co.uk"| devnginx
    devnginx -->|"plain HTTP to forwarded port\nlocalhost:9000"| nginx
    nginx -->|"/ and /api proxied\nhttp://restorer:9000"| restorer
    restorer -->|"AWS SDK (S3)\nhttp://s3.localstack:4566"| localstack
```

## Key points

- **TLS is terminated once, by the host's `dev-nginx`.** It serves the trusted
  `restorer.local.dev-gutools.co.uk` domain and proxies **plain HTTP** to the
  container, so the local nginx listens on `:80` (not `:443`).
- The devcontainer publishes the nginx container's port `80` to host port `9000`
  (fixed for `dev:local`; dynamic in the e2e suite). `dev-nginx` proxies to that
  port.
- **`/cookie`** is served same-origin with the app. It returns a prebaked
  pan-domain auth cookie (generated from the static local test key at image build
  time — see [`generate-pan-domain-cookie.ts`](./generate-pan-domain-cookie.ts))
  and redirects to `/`, giving an authenticated session without the real OAuth
  flow.
- The **restorer** container talks to **localstack** over the Testcontainers network
  for its S3 dependencies (pan-domain settings/keys, permissions, snapshots).

## Files

| File | Purpose |
| --- | --- |
| [`entrypoint.sh`](./entrypoint.sh) | Installs the toolchain and dependencies, then runs the selected app entrypoint. |
| [`nginx.Dockerfile`](./nginx.Dockerfile) | nginx proxy + `/cookie`, with the cookie baked in at build time. |
| [`nginx-dev.conf.template`](./nginx-dev.conf.template) | nginx server config; the cookie token is templated in via `envsubst`. |
| [`generate-pan-domain-cookie.ts`](./generate-pan-domain-cookie.ts) | Build-time cookie generator reusing the project's cookie helper. |
| [`entrypoint.dev.sh`](./entrypoint.dev.sh) | Restorer container entrypoint (Vite + `sbt run`). |
| [`run-dev-local.ts`](./run-dev-local.ts) | `npm run dev:local` — starts the stack and keeps it running. |
