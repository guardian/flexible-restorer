#!/usr/bin/env bash

NODE_VERSION="4.4.5"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

nvm use ${NODE_VERSION}
install jspm
node_modules/.bin/jspm config registries.github.auth $1
npm install
npm run bundle
