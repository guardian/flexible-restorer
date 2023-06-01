# Restorer

Restores snapshotted content back into Composer.

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

* Get [Composer credentials from Janus](https://janus.gutools.co.uk/credentials?permissionId=composer-dev)
* Make sure you have `restore_content` permission on [CODE environment](https://permissions.code.dev-gutools.co.uk/admin)
* Log in to [CODE Workflow](https://workflow.code.dev-gutools.co.uk/dashboard)

## Start the app
```
$ sbt
[restorer] $ run
```

The app will then be accessible locally at: <https://restorer.local.dev-gutools.co.uk/>

