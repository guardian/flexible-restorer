# Restorer

Restores snapshotted content back into Composer. The snapshotting itself is taken care of in [flexible-snapshotter](https://github.com/guardian/flexible-snapshotter).

## Before running locally

### Set up

Run `./scripts/setup`.

### Install client-side dependencies and build JS/CSS

```
$ nvm use
$ npm install
$ npm run build

# Alternatively to continously watch for changes and rebuild
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

The startup script writes a profile for the app from the AWS env vars you pass in.

```
docker build -t flexible-restorer -f images/restorer.Dockerfile .
```

Single command:

```
./scripts/docker/run-docker-local-domain
```

```
docker run --rm -p 9001:9000 \
	-e AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY \
	-e AWS_SESSION_TOKEN \
	-e AWS_PROFILE \
	-e AWS_REGION \
	flexible-restorer
```

To run with local domain proxy support via nginx (inside the container), expose 80/443 as well:

```
docker run --rm -p 80:80 -p 443:443 -p 9000:9000 \
	-e AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY \
	-e AWS_SESSION_TOKEN \
	-e AWS_PROFILE \
	-e AWS_REGION \
	flexible-restorer
```

Notes:

- Using `-e VAR_NAME` (without `=value`) forwards the current value from your shell.
- The container entrypoint writes `/root/.aws/credentials` and `/root/.aws/config` from those env vars before running sbt.
- This project image sets `AWS_SDK_LOAD_CONFIG=1`, so Java AWS SDK profile loading works as expected.
- If port 9001 is busy, switch to another host port (for example `-p 9002:9000`).
- For local MinIO, pass `AWS_ENDPOINT_URL_S3=http://host.docker.internal:9000`

## Run end-to-end tests

The app build remains on `.nvmrc` (Node 12), but Playwright requires Node 18+.

Use:

```
npm run test:e2e
```

This command runs through `scripts/test-e2e` and requires your current Node to be >= 18.

## Run local stack only

If you want the same Testcontainers stack used by the e2e test without running the
spec itself, use:

```
npm run local:stack
```

This starts MinIO and Restorer using the same bootstrap code as the e2e suite and
keeps the stack running until you press Ctrl+C.

The command runs the TypeScript runner under Node 20 via nvm so it does not pick
up an older local default Node version.

This is only to help debug the test runner, rather than a stack for local development.
