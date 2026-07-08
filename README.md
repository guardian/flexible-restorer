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

## Testing

The end-to-end (Playwright + Cucumber) suite lives in its own sub-package under
`tests/`, with its own `package.json`, lockfile and `node_modules`. This keeps it
on a modern Node (20, see `tests/.nvmrc`) independently of the main application
build, which targets the older Node pinned by the root `.nvmrc`.

You don't need to install the e2e dependencies by hand — the `npm run test:e2e`
and `npm run local:stack` scripts install them into `tests/` (and switch to the
right Node via `nvm`) automatically. It helps to have `nvm` installed.

Then there are 2 options:

### Stand alone mode

This will spin up the local stack as part of the test setup.

`npm run test:e2e`

### Test against an existing running stack

This will run the tests against an existing running stack.

In one terminal run:

`npm run local:stack`

And in another run:

`npm run test:e2e`
