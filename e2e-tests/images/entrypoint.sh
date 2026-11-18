#!/usr/bin/env bash

set -euo pipefail

mise trust /app/.tool-versions
mise install java node sbt
mise reshim
npm ci

exec bash "$@"