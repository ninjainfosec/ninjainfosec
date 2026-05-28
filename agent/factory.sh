#!/usr/bin/env bash
# One-click: build a whole site end-to-end from a single brief.
#   ./factory.sh "artisan sourdough bakery in Lisbon"
# Review gates are auto-approved. Money/go-live stay off unless you export
# ALLOW_DOMAIN_PURCHASE=1 / ALLOW_DNS_WRITE=1 / ALLOW_GO_LIVE=1 (and VERCEL_TOKEN).
set -euo pipefail
cd "$(dirname "$0")"
exec node cli.js auto "$@"
