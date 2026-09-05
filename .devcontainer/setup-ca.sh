#!/usr/bin/env bash
# Trusts the host's mkcert root CA, so HTTPS calls to *.local.dev-gutools.co.uk
# succeed from both command line tools and the JVM.
#
# The CA is mounted read-only from the host (see mounts in devenv.yaml). Only
# rootCA.pem is mounted, never the sibling rootCA-key.pem, so mkcert runs in
# keyless mode - where -install is the only supported operation, which is all we
# need here.

set -euo pipefail

CAROOT="${DEVENV_MKCERT_CAROOT:-/mnt/mkcert}"
export CAROOT

log() { printf '\033[1;36m[ca] %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[ca] %s\033[0m\n' "$*"; }

ca_file="$CAROOT/rootCA.pem"
if [[ ! -f "$ca_file" ]]; then
  warn "No mkcert root CA at $ca_file - HTTPS to *.local.dev-gutools.co.uk will fail."
  warn "Run 'mkcert -install' on the host, then rebuild the container."
  exit 0
fi

if ! command -v mkcert >/dev/null 2>&1; then
  log "Installing mkcert."
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mkcert
fi

# The JVM uses the JDK's own cacerts rather than the system trust store, so
# mkcert needs JAVA_HOME to reach it. postStartCommand runs without ~/.bashrc,
# so neither mise nor its shims are on PATH.
mise="$HOME/.local/bin/mise"
trust_stores="system"
if [[ -x "$mise" ]] && java_bin=$("$mise" which java 2>/dev/null); then
  export JAVA_HOME="${java_bin%/bin/java}"
  trust_stores="system,java"
else
  warn "No mise-managed JDK found - the JVM will not trust this CA."
fi

# Naming the stores explicitly skips the NSS store, which would otherwise warn
# about missing certutil. mkcert elevates to root itself for the system store.
log "Installing $(basename "$ca_file") into: $trust_stores"
TRUST_STORES="$trust_stores" mkcert -install

log "Done."
