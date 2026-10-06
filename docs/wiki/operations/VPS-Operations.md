# VPS operations

Snapshot verified 6 October 2026. Re-check live state before acting; this page describes the layout, not the current moment.

## The server

| | |
|---|---|
| Host | `anshkosh.com` / `www.anshkosh.com` (DNS at Spaceship; both point at this VPS) |
| OS | AlmaLinux 8.10 |
| Size | 3.66 GiB RAM, 2 GiB swap, 98 GB disk |
| Timezone | **America/Denver**. Timers run on Denver time; do not change it casually. |
| Web server | nginx 1.14.1, TLS from Let's Encrypt (`certbot-renew.timer`) |
| Runtime | Node 22.23.2 at `/home/deploy/.nvm/versions/node/v22.23.2/bin`, PM2 7 |
| Database | PostgreSQL 15 (`postgresql-15`), listening on `127.0.0.1:5432` only, database `anshkosh` |
| Cache/queues | Redis on `127.0.0.1:6379`, password-protected |
| Firewall | firewalld, public zone: ssh, http, https, cockpit, dhcpv6-client |
| Other | fail2ban, crond, collectd, chronyd, Acronis agent (its protection plan is not confirmed active) |

## Access

- **Admin (root):** SSH on port 22 with a maintenance key held by the operator (not in Git, not in the wiki). Root access is unrestricted, so treat every command as production.
- **Deploy user:** `deploy` owns the app, releases and PM2. Its GitHub Actions key is a forced command that can only run `check` or `deploy <sha>`. Arush also has `deploy` access.
- **Host key** (Ed25519): `SHA256:VBVYKtdbFnMB900C8S2MFaEk3cKmWoDZE/KaOluE1cg`. Keep strict host-key checking on. A mismatch means stop and investigate.
- `deploy` may run only `/usr/local/sbin/anshkosh-route 3000` or `3012` without a password.
- Ask the owner before adding, removing or changing any SSH key, sudo rule or firewall rule.

## Filesystem layout

| Path | What |
|---|---|
| `/var/www/anshkosh-releases/<sha>.<suffix>/` | One directory per deployed commit (about 2 GB each) |
| `/var/www/anshkosh-shared/.env` | Production secrets (mode 600, `deploy`). Never print or copy elsewhere. |
| `/var/www/anshkosh-shared/static/` | Shared hashed `/_next/static` assets, kept for older browser tabs |
| `/var/www/anshkosh-shared/state/current.json` | Live commit, release, port and web process name |
| `/var/www/anshkosh-shared/state/deploy.lock` | Deployment lock (`flock`); maintenance that touches releases takes it too |
| `/var/www/anshkosh-shared/state/operations/` | `backup.json`, `restore.json`, `health.json` |
| `/var/www/anshkosh-shared/backups/` | Local database dumps (private) |
| `/var/www/anshkosh` | Original pre-pipeline checkout. Not the live app; keep it. |
| `/etc/nginx/conf.d/anshkosh.conf` | **Live** nginx config |
| `/var/lib/anshkosh-routing/` | Root-only backups of nginx config changes |
| `/usr/local/libexec/anshkosh-*`, `/usr/local/sbin/anshkosh-route` | Root-owned deploy, ops and routing helpers |
| `/home/deploy/.pm2/` | PM2 home, logs and saved process list |

## Processes

PM2 runs as `deploy`. Never run `pm2` as root, which would start a second, empty PM2 daemon.

```bash
runuser -u deploy -- env PATH=/home/deploy/.nvm/versions/node/v22.23.2/bin:$PATH pm2 ls
```

Expected: `anshkosh-web-3000` or `anshkosh-web-3012`, `worker-email`, `worker-notification`, `worker-sync` and `pm2-logrotate`, all `online`, all with the live release as cwd. The web process restarts itself above 512 MB and workers above 256 MB.

## Scheduled jobs (systemd timers)

| Timer | When (Denver time) | What |
|---|---|---|
| `anshkosh-check.timer` | Every 5 min | Health checks: public site, DB, Redis, PM2, disk, RAM, load, backup freshness. Alerts go to anshkosh@gmail.com via Brevo. |
| `anshkosh-backup.timer` | Daily 02:30 | Encrypted off-site DB backup; see [Backups](Backups-and-Restore.md) |
| `anshkosh-restore-test.timer` | Sunday 04:00 | Restores the latest backup into a throwaway instance to prove it works |
| `anshkosh-prune-releases.timer` | Daily 03:30 | Deletes old releases, keeping the live one and the newest 3 |
| `certbot-renew.timer` | Twice daily | TLS renewal; the current certificate expires 30 Dec 2026 |

There is also a legacy `deploy` crontab entry (daily 20:30) that runs `/var/www/anshkosh/deploy/backup.sh`. Its success has never been verified and its target directory does not exist. Do not count it as a backup.

## Health checks (read-only)

```bash
systemctl is-active nginx postgresql-15 redis pm2-deploy certbot-renew.timer
systemctl list-timers --all | grep -E 'anshkosh|certbot'
cat /var/www/anshkosh-shared/state/current.json
df -h /; free -m
curl -s https://www.anshkosh.com/api/cron/health
curl -s https://www.anshkosh.com/.well-known/release.json
```

## Logs

| Log | Path |
|---|---|
| Web and workers | `/home/deploy/.pm2/logs/` (file names change with each deploy) |
| PM2 daemon | `/home/deploy/.pm2/pm2.log` |
| nginx | `/var/log/nginx/access.log`, `error.log` |
| systemd jobs | `journalctl -u nginx -u pm2-deploy`, `journalctl -u 'anshkosh-ops@*' -u anshkosh-restore-test -u anshkosh-prune-releases` |

Logs can contain personal data and secrets. Read them on the server and share only filtered, redacted excerpts.

## Open follow-ups

- No uptime monitoring from outside the VPS; the 5-minute checks cannot alert if the whole server is down.
- Nobody has confirmed that alert emails actually arrive at anshkosh@gmail.com.
- The Acronis/hosting backup plan showed "Not protected" when last checked (2 Oct).
- The backup encryption key's only off-server copy is tied to one Windows user on one PC; a portable recovery copy is needed.
- The legacy backup cron job should be retired or repaired.
