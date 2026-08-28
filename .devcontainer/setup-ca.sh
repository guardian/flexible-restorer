#!/usr/bin/env bash
# Trusts the host's mkcert root CA, so HTTPS calls to *.local.dev-gutools.co.uk
# succeed from both command line tools and the JVM.
#
# The CA is mounted read-only from the host (see mounts in devenv.yaml). It has
# to be installed in two places: the system store, used by curl/node, and each
# JDK's own cacerts, which the JVM uses instead of the system store.

set -euo pipefail

CA_SOURCE_DIR="${DEVENV_MKCERT_CAROOT:-/mnt/mkcert}"
CA_NAME="mkcert-dev-root-ca"
SYSTEM_CA_FILE="/usr/local/share/ca-certificates/$CA_NAME.crt"
JDK_INSTALL_DIR="$HOME/.local/share/mise/installs/java"

log() { printf '\033[1;36m[ca] %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[ca] %s\033[0m\n' "$*"; }

ca_file="$CA_SOURCE_DIR/rootCA.pem"
if [[ ! -f "$ca_file" ]]; then
  warn "No mkcert root CA at $ca_file - HTTPS to *.local.dev-gutools.co.uk will fail."
  warn "Run 'mkcert -install' on the host, then rebuild the container."
  exit 0
fi

log "Installing $(basename "$ca_file") into the system trust store."
sudo cp "$ca_file" "$SYSTEM_CA_FILE"
sudo update-ca-certificates >/dev/null

# mise-installed JDKs ship their own cacerts, so update-ca-certificates alone
# leaves the JVM unable to verify these certificates. mise keeps version aliases
# as symlinks, so resolve them to avoid importing into the same store repeatedly.
shopt -s nullglob
truststores=$(
  for candidate in "$JDK_INSTALL_DIR"/*/lib/security/cacerts "$JDK_INSTALL_DIR"/*/jre/lib/security/cacerts; do
    readlink -f "$candidate"
  done | sort -u
)
shopt -u nullglob

while read -r truststore; do
  [[ -n "$truststore" ]] || continue
  # postStartCommand runs without ~/.bashrc, so the mise shims aren't on PATH.
  keytool="${truststore%/lib/security/cacerts}/bin/keytool"
  if [[ ! -x "$keytool" ]]; then
    warn "No keytool at $keytool - skipping $truststore."
    continue
  fi
  log "Importing into $truststore"
  "$keytool" -delete -alias "$CA_NAME" -keystore "$truststore" -storepass changeit >/dev/null 2>&1 || true
  "$keytool" -importcert -noprompt -trustcacerts -alias "$CA_NAME" \
    -file "$ca_file" -keystore "$truststore" -storepass changeit >/dev/null 2>&1
done <<<"$truststores"

log "Done."
