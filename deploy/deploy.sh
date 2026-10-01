#!/usr/bin/env bash
set -euo pipefail
printf 'Production deployment is managed by GitHub Actions on main.\n'
printf 'Do not rebuild or git-pull inside the running production release.\n'
printf 'See deploy/README.md for deployment and recovery instructions.\n'
exit 64
