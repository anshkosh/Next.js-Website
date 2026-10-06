#!/usr/bin/env bash
# Manual root installation of reviewed operational tooling, without antivirus or a website deploy.
set -euo pipefail
[[ $(id -u) == 0 ]] || { echo 'Run as the VPS root operator.'; exit 1; }
cd "$(dirname "${BASH_SOURCE[0]}")"
anshkosh_node=/home/deploy/.nvm/versions/node/v22.23.2/bin/node
[[ -x "$anshkosh_node" ]] && id deploy >/dev/null
for anshkosh_binary in pg_dump pg_restore initdb pg_ctl psql; do
  [[ -x "/usr/pgsql-15/bin/$anshkosh_binary" ]] || { echo "Missing PostgreSQL 15 tool: $anshkosh_binary"; exit 1; }
done
for anshkosh_target in /usr/local/libexec/anshkosh-operations /usr/local/libexec/anshkosh-ops /etc/systemd/system/anshkosh-ops@.service /etc/systemd/system/anshkosh-check.timer /etc/systemd/system/anshkosh-backup.timer /etc/systemd/system/anshkosh-restore-test.service /etc/systemd/system/anshkosh-restore-test.timer; do
  [[ ! -e "$anshkosh_target" ]] || { echo "Existing $anshkosh_target requires manual comparison; no files overwritten."; exit 1; }
done
for anshkosh_module in operations backup-crypto isolated-restore monitor-policy; do
  "$anshkosh_node" --check "$anshkosh_module.mjs"
done
bash -n ops-run.sh
install -d -m 0755 -o root -g root /usr/local/libexec/anshkosh-operations
for anshkosh_module in operations backup-crypto isolated-restore monitor-policy; do
  install -m 0644 -o root -g root "$anshkosh_module.mjs" "/usr/local/libexec/anshkosh-operations/$anshkosh_module.mjs"
done
install -m 0755 -o root -g root ops-run.sh /usr/local/libexec/anshkosh-ops
install -d -m 0700 -o deploy -g deploy /var/www/anshkosh-shared/state/operations /var/www/anshkosh-shared/backups/operations
for anshkosh_unit in anshkosh-ops@.service anshkosh-check.timer anshkosh-backup.timer anshkosh-restore-test.service anshkosh-restore-test.timer; do
  install -m 0644 -o root -g root "systemd/$anshkosh_unit" "/etc/systemd/system/$anshkosh_unit"
done
systemctl daemon-reload
echo 'Operations tooling installed. No timer enabled, antivirus installed, website deployed or account changed. Configure and verify backup, restore and alerts before enabling timers.'
