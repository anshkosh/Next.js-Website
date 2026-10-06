#!/usr/bin/env bash
# Install root-owned at /usr/local/libexec/anshkosh-prune-releases; runs as deploy from
# anshkosh-prune-releases.service. Keeps the live release plus the newest releases so a
# rollback target always remains, and deletes older release directories.
set -euo pipefail
umask 077
releases=/var/www/anshkosh-releases
shared=/var/www/anshkosh-shared
keep=${ANSHKOSH_KEEP_RELEASES:-3}
[[ $keep =~ ^[0-9]+$ ]] && (( keep >= 2 )) || { echo "ANSHKOSH_KEEP_RELEASES must be at least 2" >&2; exit 64; }

# Never race a deployment: skip this run if one holds the lock.
exec 9>"$shared/state/deploy.lock"
flock -n 9 || { echo "Deployment in progress; skipping release pruning."; exit 0; }

live=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["release"])' "$shared/state/current.json")
[[ $(dirname -- "$live") == "$releases" && -d $live ]] || { echo "Live release in current.json is invalid: $live" >&2; exit 1; }

mapfile -t newest_first < <(find "$releases" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended \
  -regex '.*/[0-9a-f]{40}\.[A-Za-z0-9]{8}' -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)

in_use=$(for cwd in /proc/[0-9]*/cwd; do readlink -- "$cwd" 2>/dev/null || true; done)
kept=0
for release in "${newest_first[@]}"; do
  if [[ $release == "$live" ]] || (( kept < keep )); then
    kept=$((kept + 1)); continue
  fi
  if grep -qxF -- "$release" <<<"$in_use" || grep -qF -- "$release/" <<<"$in_use"; then
    echo "Keeping $release: a process is running from it."; continue
  fi
  rm -rf --one-file-system -- "$release"
  echo "Deleted $release"
done
df -h --output=used,avail,pcent "$releases" | tail -1
