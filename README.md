# Installation

## Set up Pan domain authentication
Follow the [dev-nginx README](https://github.com/guardian/dev-nginx). There is an nginx mapping file in `nginx/`.

## Install client-side dependencies and build JS/CSS

Note that you'll need at least Node 4 in order to run JSPM correctly.

```
$ npm install
```

## Starting the app
```
$ sbt
[restorer] $ run
```

The app will then be accessible locally at: https://restorer.local.dev-gutools.co.uk/

## Developing

Instead of the asset pipeline in Play we're using more standard frontend technologies: JSPM for dependency management
and ES6 modules. We also use JSPM to bundle the JS assets for production. Finally we use SASS for CSS which is built
using `node-sass`.

When changing SASS you'll want to use `npm run build-sass` to rebuild the CSS. There is a watch task that can be run
 in the background with `npm run watch-sass`.

## Bundling for production

You shouldn't need to bundle the application when developing locally. If you need to debug an issue that is related to
bundling (e.g. an issue that is only occurring on a stack) then you can use the `npm run bundle` command.

This command creates `public/build.js` and `public/build.js.map`. These are in `.gitignore` but be cautious of the fact
that it also **modifies** `public/config,js` and the modifications **must not** be checked in.

# Credentials

To access the *local* instance of Restorer:

* Get [Composer credentials from Janus](https://janus.gutools.co.uk/credentials?permissionId=composer-dev)
* Add these same credentials also as *default* to your `.aws/credentials`
* Make sure you have `restore_content` permission on [CODE environment](https://permissions.code.dev-gutools.co.uk/admin)
* Log in to [CODE Workflow](https://workflow.code.dev-gutools.co.uk/dashboard)
