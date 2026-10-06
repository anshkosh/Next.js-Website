#!/usr/bin/env bash
# Reviewed, manual root operation. Never run through the restricted deploy key.
set -euo pipefail
[[ $(id -u) == 0 ]] || { echo 'Run from the VPS root terminal.'; exit 1; }
cd "$(dirname "${BASH_SOURCE[0]}")"
anshkosh_available_kb=$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)
# Budget 4 GiB for ClamD and 1 GiB for signature updates/operating headroom.
# This is available memory in addition to the currently running website/database.
[[ "$anshkosh_available_kb" -ge 5242880 ]] || { echo 'At least 5 GiB available RAM is required for this scanner setup. Provision capacity or a dedicated scanning service; nothing installed.'; exit 1; }
command -v /home/deploy/.nvm/versions/node/v22.23.2/bin/node >/dev/null
id deploy >/dev/null
# Keep this package installation explicit; no repository/bootstrap curl scripts.
dnf install -y epel-release
dnf install -y clamav clamav-update clamd
command -v clamd >/dev/null
command -v freshclam >/dev/null
id clamupdate >/dev/null
[[ -x /usr/sbin/clamd && -x /usr/bin/freshclam ]] || { echo 'Package binary paths differ; review the supplied service units before installing.'; exit 1; }
# Operations can be installed separately before scanner approval/capacity exists.
if [[ ! -e /usr/local/libexec/anshkosh-ops && ! -e /usr/local/libexec/anshkosh-operations ]]; then
  bash install-operations.sh
fi
[[ -x /usr/local/libexec/anshkosh-ops && -f /usr/local/libexec/anshkosh-operations/operations.mjs ]] || { echo 'Existing operations installation requires manual comparison.'; exit 1; }
# Do not overwrite existing service files.
for anshkosh_target in /etc/clamd.d/anshkosh.conf /etc/anshkosh-freshclam.conf /etc/systemd/system/anshkosh-clamd.service /etc/systemd/system/anshkosh-freshclam.service /etc/systemd/system/anshkosh-freshclam.timer; do
  [[ ! -e "$anshkosh_target" ]] || { echo "Existing $anshkosh_target requires manual comparison. No configuration overwritten."; exit 1; }
done
install -m 0644 clamd-anshkosh.conf /etc/clamd.d/anshkosh.conf
install -m 0644 freshclam-anshkosh.conf /etc/anshkosh-freshclam.conf
install -m 0644 systemd/anshkosh-clamd.service /etc/systemd/system/anshkosh-clamd.service
install -m 0644 systemd/anshkosh-freshclam.service /etc/systemd/system/anshkosh-freshclam.service
install -m 0644 systemd/anshkosh-freshclam.timer /etc/systemd/system/anshkosh-freshclam.timer
freshclam --config-file=/etc/anshkosh-freshclam.conf
systemctl daemon-reload
systemctl enable --now anshkosh-clamd.service
systemctl enable --now anshkosh-freshclam.timer
echo 'Scanner installed. Verify clean/EICAR checks, configure backup encryption and alert recipient, then enable the operations timers as described in LAUNCH-SAFEGUARDS.md.'
