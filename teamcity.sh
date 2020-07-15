#!/usr/bin/env bash

set -e

setupNvm() {
  export NVM_DIR="$HOME/.nvm"
  [[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"  # This loads nvm

  nvm install
  nvm use
}


buildJs() {
  echo "##teamcity[compilationStarted compiler='js']"

  setupNvm

  # clear old packages first
  rm -rf node_modules

  npm install
  npm run build

  echo "##teamcity[compilationFinished compiler='js']"
}

buildSbt() {
  echo "##teamcity[compilationStarted compiler='sbt']"
  sbt clean compile test riffRaffUpload
  echo "##teamcity[compilationFinished compiler='sbt']"
}

buildJs
buildSbt
