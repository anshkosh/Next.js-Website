#!/usr/bin/env bash
# One-time root installation; does not switch traffic or start/stop production.
set -euo pipefail
umask 077
[[ $EUID == 0 && $# == 2 ]] || { printf 'Usage (root): install-automatic.sh <existing-release> <public-key-file>\n' >&2; exit 64; }
baseline=$(realpath "$1")
[[ $baseline == /var/www/anshkosh-releases/* && -f "$baseline/.env" && -d "$baseline/.next/static" ]] || exit 64
[[ $(head -c 12 "$2") == ssh-ed25519\  ]] || exit 64
source_dir=$(cd "$(dirname "$0")" && pwd)
shared=/var/www/anshkosh-shared
node=/home/deploy/.nvm/versions/node/v22.23.2/bin/node

install -d -m 755 -o root -g root /usr/local/libexec "$shared"
install -d -m 700 -o deploy -g deploy "$shared/state" "$shared/incoming" "$shared/backups"
install -d -m 755 -o deploy -g deploy "$shared/static" /var/www/anshkosh-releases
if [[ ! -f $shared/.env ]]; then
  install -m 600 -o deploy -g deploy "$baseline/.env" "$shared/.env"
fi
if [[ ! -f $shared/state/current.json ]]; then
  "$node" -e 'require("fs").writeFileSync(process.argv[2],JSON.stringify({commit:"4a23eb04569cb8faf6843e13dc7f1d8eb802b92d",release:process.argv[1],port:3000,webName:"anshkosh-web"}))' "$baseline" "$shared/state/current.json"
  chown deploy:deploy "$shared/state/current.json"
fi
cp -r "$baseline/.next/static/." "$shared/static/"
chown -R deploy:deploy "$shared/static"
restorecon -R "$shared"

install -m 755 -o root -g root "$source_dir/receive.sh" /usr/local/libexec/anshkosh-receive
install -m 755 -o root -g root "$source_dir/validate-archive.py" /usr/local/libexec/anshkosh-validate-archive
install -m 644 -o root -g root "$source_dir/automatic-deploy.mjs" /usr/local/libexec/anshkosh-deploy.mjs
install -m 644 -o root -g root "$source_dir/deployment-policy.mjs" /usr/local/libexec/deployment-policy.mjs
install -m 644 -o root -g root "$source_dir/deployment-runtime.mjs" /usr/local/libexec/deployment-runtime.mjs
install -m 755 -o root -g root "$source_dir/route.py" /usr/local/sbin/anshkosh-route
"$node" --check /usr/local/libexec/anshkosh-deploy.mjs
bash -n /usr/local/libexec/anshkosh-receive
printf 'deploy ALL=(root) NOPASSWD: /usr/local/sbin/anshkosh-route 3000, /usr/local/sbin/anshkosh-route 3012\n' > /etc/sudoers.d/anshkosh-routing
chmod 440 /etc/sudoers.d/anshkosh-routing
visudo -cf /etc/sudoers.d/anshkosh-routing

install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
key=$(tr -d '\r\n' < "$2")
authorized=/home/deploy/.ssh/authorized_keys
if [[ ! -f $authorized ]] || ! grep -Fq -- "$key" "$authorized"; then
  if [[ -f $authorized ]]; then
    cp -p "$authorized" /root/anshkosh-authorized-keys-before-automation
    printf '\n' >> "$authorized"
  fi
  printf 'restrict,command="/usr/local/libexec/anshkosh-receive" %s\n' "$key" >> "$authorized"
fi
chown deploy:deploy "$authorized"
chmod 600 "$authorized"
restorecon -R /home/deploy/.ssh
printf 'Automatic deployment helpers installed; production traffic is unchanged.\n'
