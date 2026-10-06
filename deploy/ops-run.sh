#!/usr/bin/env bash
set -euo pipefail
anshkosh_node=/home/deploy/.nvm/versions/node/v22.23.2/bin/node
anshkosh_release="$($anshkosh_node -p 'JSON.parse(require("fs").readFileSync("/var/www/anshkosh-shared/state/current.json")).release')"
[[ "$anshkosh_release" =~ ^/var/www/anshkosh-releases/[0-9a-f]{40}\.[A-Za-z0-9]{8}$ ]] || exit 1
cd "$anshkosh_release"
exec "$anshkosh_node" --env-file=/var/www/anshkosh-shared/.env /usr/local/libexec/anshkosh-operations/operations.mjs "${1:-check}"
