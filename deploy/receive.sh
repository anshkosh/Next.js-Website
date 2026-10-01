#!/usr/bin/env bash
# Install root-owned at /usr/local/libexec/anshkosh-receive.
# The dedicated authorized_keys entry forces this command, with no forwarding/PTY.
set -euo pipefail
umask 077
export PATH=/home/deploy/.nvm/versions/node/v22.23.2/bin:/usr/local/bin:/usr/bin:/bin
shared=/var/www/anshkosh-shared
releases=/var/www/anshkosh-releases

if [[ ${SSH_ORIGINAL_COMMAND:-} == check ]]; then
  printf 'Restricted deployment access is ready.\n'
  cat "$shared/state/current.json"
  exit 0
fi
if [[ ! ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  printf 'Only check or deploy <40-character commit SHA> is permitted.\n' >&2
  exit 64
fi
commit=${BASH_REMATCH[1]}
exec 9>"$shared/state/deploy.lock"
flock -n 9 || { printf 'Another deployment is running.\n' >&2; exit 75; }
archive=$(mktemp "$shared/incoming/archive.XXXXXXXX.tar.gz")
trap 'rm -f -- "$archive"' EXIT
cat > "$archive"
# Refuse links and path traversal before extracting any untrusted archive member.
python3 /usr/local/libexec/anshkosh-validate-archive "$archive"
release=$(mktemp -d "$releases/$commit.XXXXXXXX")
chmod 755 "$release"
tar --extract --gzip --file="$archive" --directory="$release" --no-same-owner --no-same-permissions
node --env-file="$shared/.env" /usr/local/libexec/anshkosh-deploy.mjs "$release" "$commit"
