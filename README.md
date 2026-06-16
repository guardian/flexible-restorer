# Restorer

Restores snapshotted content back into Composer. The snapshotting itself is taken care of in [flexible-snapshotter](https://github.com/guardian/flexible-snapshotter).

## Before running locally

### Set up

### Install client-side dependencies and build JS/CSS

Tool versions (Node, Java, sbt, Scala) are pinned in `.tool-versions` and managed
with [mise](https://mise.jdx.dev). Install them once with `mise install`, then:

Run `./scripts/setup`.

```
$ npm install
$ npm run build

# Alternatively to continuously watch for changes and rebuild
$ npm run watch
```

This project does not have hot module reloading so you will have to reload the page on Javascript or SCSS updates

### Get credentials

- Get [Composer credentials from Janus](https://janus.gutools.co.uk/credentials?permissionId=composer-dev)
- Make sure you have `restore_content` permission on [CODE environment](https://permissions.code.dev-gutools.co.uk/admin)
- Log in to [CODE Workflow](https://workflow.code.dev-gutools.co.uk/dashboard)

## Start the app

```
$ sbt
[restorer] $ run
```

The app will then be accessible locally at: <https://restorer.local.dev-gutools.co.uk/>

## Run with Docker (including AWS credentials)

You can pass your current shell AWS credentials and profile into the container.

```
docker build -t flexible-restorer -f images/restorer.Dockerfile .
```

Single command:

```
./scripts/run-docker-local-domain
```

```
docker run --rm -p 9001:9000 \
	-e AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY \
	-e AWS_SESSION_TOKEN \
	-e AWS_PROFILE \
	-v "$HOME/.aws:/root/.aws:ro" \
	flexible-restorer
```

To run with local domain proxy support via nginx (inside the container), expose 80/443 as well:

```
docker run --rm -p 80:80 -p 443:443 -p 9000:9000 \
	-e AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY \
	-e AWS_SESSION_TOKEN \
	-e AWS_PROFILE \
	-v "$HOME/.aws:/root/.aws:ro" \
	flexible-restorer
```

Notes:

- Using `-e VAR_NAME` (without `=value`) forwards the current value from your shell.
- Mounting `~/.aws` lets profile-based auth work inside the container.
- This project image sets `AWS_SDK_LOAD_CONFIG=1`, so Java AWS SDK profile loading works as expected.
- If port 9001 is busy, switch to another host port (for example `-p 9002:9000`).

## Run local MinIO S3 with startup buckets

Build and run a dedicated MinIO container that creates these buckets on startup:

- `pan-domain-auth-settings`
- `flexible-snapshotter-code`

Single command:

```
./scripts/run-docker-minio-local
```

Environment variables you can override:

- `MINIO_ROOT_USER` (default `minioadmin`)
- `MINIO_ROOT_PASSWORD` (default `minioadmin`)
- `PAN_DOMAIN_BUCKET` (default `pan-domain-auth-settings`)
- `SNAPSHOT_BUCKET` (default `flexible-snapshotter-code`)
- `MINIO_DATA_VOLUME` (default `flexible-restorer-minio-data`)

Direct build/run:

```
docker build -t flexible-restorer-minio -f images/minio.Dockerfile .

docker run --rm -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -e PAN_DOMAIN_BUCKET=pan-domain-auth-settings \
  -e SNAPSHOT_BUCKET=flexible-snapshotter-code \
  -v flexible-restorer-minio-data:/data \
  flexible-restorer-minio
```

The startup script runs MinIO as a background child process, traps `INT`/`TERM`/`HUP` signals, forwards termination signals to MinIO, and waits for clean shutdown. Bucket creation uses `aws s3api create-bucket` against the local MinIO endpoint.
