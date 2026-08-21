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
