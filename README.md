# Installation



## Set up Pan domain authentication
Follow the [dev-nginx README](https://github.com/guardian/dev-nginx). There is an nginx mapping file in `nginx/`.

## Install client-side dependencies and build JS/CSS

```
$ nvm use
$ npm install
$ npm run build

# Alternatively to continously watch for changes and rebuild
$ npm run watch
```

This project does not have hot module reloading so you will have to reload the page on Javascript or SCSS updates

## Starting the app
```
$ sbt
[restorer] $ run
```

The app will then be accessible locally at: https://restorer.local.dev-gutools.co.uk/

# Credentials

To access the *local* instance of Restorer:

* Get [Composer credentials from Janus](https://janus.gutools.co.uk/credentials?permissionId=composer-dev)
* Make sure you have `restore_content` permission on [CODE environment](https://permissions.code.dev-gutools.co.uk/admin)
* Log in to [CODE Workflow](https://workflow.code.dev-gutools.co.uk/dashboard)
