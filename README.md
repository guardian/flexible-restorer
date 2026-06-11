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

```
docker run --rm -p 9001:9000 \
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
