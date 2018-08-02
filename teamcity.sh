#!/usr/bin/env bash

set -e

npm install jspm
node_modules/.bin/jspm config registries.github.auth $JSPM_GITHUB_AUTH_TOKEN
npm install
npm run bundle
