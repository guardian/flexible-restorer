#!/usr/bin/env bash
# Resolves *.local.dev-gutools.co.uk to the Docker host, so the app can reach
# other Guardian tools running outside the dev container.
#
# /etc/hosts cannot express wildcards, so we run dnsmasq on 127.0.0.1 and point
# the container's resolver at it. Docker recreates /etc/resolv.conf (and may
# change the host's IP) on every container start, so this runs on every start.

set -euo pipefail

WILDCARD_DOMAIN="local.dev-gutools.co.uk"
CONF_FILE="/etc/dnsmasq-devcontainer.conf"
UPSTREAM_FILE="/etc/resolv.conf.upstream"
PID_FILE="/run/dnsmasq-devcontainer.pid"

log() { printf '\033[1;36m[dns] %s\033[0m\n' "$*"; }
error() { printf '\033[1;31m[dns] %s\033[0m\n' "$*" >&2; }

if ! command -v dnsmasq >/dev/null 2>&1; then
  log "Installing dnsmasq-base."
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq dnsmasq-base
fi

# Cache the nameservers Docker gave us, before we point resolv.conf at dnsmasq.
upstreams=$(grep '^nameserver' /etc/resolv.conf | awk '{print $2}' | grep -v '^127\.' || true)
if [[ -n "$upstreams" ]]; then
  printf '%s\n' "$upstreams" | sudo tee "$UPSTREAM_FILE" >/dev/null
elif [[ -s "$UPSTREAM_FILE" ]]; then
  upstreams=$(cat "$UPSTREAM_FILE")
else
  error "Could not determine upstream nameservers from /etc/resolv.conf."
  exit 1
fi

# Map every family the host is reachable on; an address= line only answers the
# family it belongs to, so an IPv6-only mapping would break plain A lookups.
host_ips=$(
  { getent ahostsv4 host.docker.internal || true; getent ahostsv6 host.docker.internal || true; } |
    awk '{print $1}' | sort -u
)
if [[ -z "$host_ips" ]]; then
  error "host.docker.internal did not resolve; is this Docker Desktop?"
  exit 1
fi

log "Mapping *.$WILDCARD_DOMAIN to $(tr '\n' ' ' <<<"$host_ips")"
{
  echo "listen-address=127.0.0.1"
  echo "bind-interfaces"
  echo "no-resolv"
  while read -r host_ip; do
    [[ -n "$host_ip" ]] && echo "address=/$WILDCARD_DOMAIN/$host_ip"
  done <<<"$host_ips"
  while read -r nameserver; do
    [[ -n "$nameserver" ]] && echo "server=$nameserver"
  done <<<"$upstreams"
} | sudo tee "$CONF_FILE" >/dev/null

if [[ -f "$PID_FILE" ]]; then
  sudo kill "$(cat "$PID_FILE")" 2>/dev/null || true
fi
sudo dnsmasq --conf-file="$CONF_FILE" --pid-file="$PID_FILE"

echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf >/dev/null

log "Done. Everything else still resolves via: $(tr '\n' ' ' <<<"$upstreams")"
