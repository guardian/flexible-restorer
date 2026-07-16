# Restorer

Restores snapshotted content back into Composer. The snapshotting itself is taken care of in [flexible-snapshotter](https://github.com/guardian/flexible-snapshotter).

## Before running locally

### Set up

Run `./scripts/setup`.

### Install client-side dependencies and build JS/CSS

Tool versions (Node, Java, sbt, Scala) are pinned in `.tool-versions` and managed
with [mise](https://mise.jdx.dev). Install them once with `mise install`, then:

```
$ npm install
$ mise run build

# Alternatively to continously watch for changes and rebuild
$ mise run watch
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

Use:

```
mise run test:e2e
```

This command runs through `scripts/test-e2e`. Node is provided by mise (see
`.tool-versions`); run `mise install` first if you haven't already.

## Run local stack only

If you want the same Testcontainers stack used by the e2e test without running the
spec itself, use:

```
mise run local:stack
```

This starts MinIO and Restorer using the same bootstrap code as the e2e suite and
keeps the stack running until you press Ctrl+C.

The command runs the TypeScript runner under the Node version pinned in
`.tool-versions`.

This is only to help debug the test runner, rather than a stack for local development.

## Testing

The end-to-end (Playwright + Cucumber) suite lives in its own sub-package under
`tests/`, with its own `package.json`, lockfile and `node_modules`. It shares the
single Node version pinned in `.tool-versions` with the main application build.

You don't need to install the e2e dependencies by hand — the `mise run test:e2e`
and `mise run local:stack` tasks install them into `tests/` automatically. It helps
to have `mise` installed and to have run `mise install`.

Then there are 2 options:

### Stand alone mode

This will spin up the local stack as part of the test setup.

`mise run test:e2e`

### Test against an existing running stack

This will run the tests against an existing running stack.

In one terminal run:

`mise run local:stack`

And in another run:

`mise run test:e2e`
