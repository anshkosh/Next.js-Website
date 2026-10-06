# Runbooks

Start every incident with the read-only [health checks](VPS-Operations.md#health-checks-read-only). Change one thing at a time, and write down what you changed.

## Site is down or erroring

1. `curl -sI https://www.anshkosh.com/` and `curl -s https://www.anshkosh.com/api/cron/health`.
2. On the server: `systemctl is-active nginx postgresql-15 redis pm2-deploy`.
3. `pm2 ls` as `deploy`: is the web process online, and is it restarting repeatedly? Check `/home/deploy/.pm2/logs/` for the web error log.
4. Check memory and disk: `free -m`, `df -h /`, and the kernel log for OOM kills. The web process restarts itself above 512 MB.
5. If a deploy just happened, compare `current.json`, `release.json`, the PM2 cwd and the nginx `proxy_pass` port. They must all agree.
6. Restart a single PM2 process only after reading its logs. Never restart all of them blindly, and never run `pm2` as root.

## Workers crash-looping or logs growing fast

The usual cause is the environment loading after imports, or a wrong Redis setting. Recreate the worker from the live release's `deploy.runtime.config.json` so it keeps `--env-file=.env --import=tsx`. A `pm2 restart --update-env` does not reproduce that setup.

## Roll back to the previous release

There is no single rollback command. Follow these steps in order:

1. Pause deploys: set `VPS_DEPLOY_ENABLED=false` in the repository variables, and make sure no deploy run is in progress.
2. On the server, take the deploy lock for the whole procedure: `exec 9>/var/www/anshkosh-shared/state/deploy.lock; flock -n 9`.
3. Save copies of `current.json`, the nginx config and the PM2 list.
4. Pick a retained release in `/var/www/anshkosh-releases/` (the pruning job keeps the newest 3). Check its schema works with the current database; migrations are not undone.
5. As `deploy`, start that release's web process on the **idle** port from its `deploy.runtime.config.json` (`--only <webName>`). Check `http://127.0.0.1:<port>/api/cron/health` and `/.well-known/release.json` before switching.
6. Switch nginx: `sudo -n /usr/local/sbin/anshkosh-route <port>` as `deploy`.
7. Recreate `worker-email`, `worker-notification` and `worker-sync` from the chosen release's runtime config. Restarting the current workers does not move them to the old release.
8. Verify the public health check, `release.json` and pages. Run `pm2 save`. Update `current.json` atomically (commit, release, port, webName, updatedAt).
9. Stop the superseded web process, then `pm2 save` again.
10. If anything fails, restore the original route and workers rather than leaving a mix. Fix forward with a new PR, then re-enable deploys.

## Edit the live nginx config

`deploy/nginx.conf` in Git is a **reference template and out of date**. Never copy it over the live file.

1. Back up: `cp /etc/nginx/conf.d/anshkosh.conf /var/lib/anshkosh-routing/nginx-manual-<topic>-$(date -u +%Y%m%dT%H%M%S).conf`
2. Edit `/etc/nginx/conf.d/anshkosh.conf` minimally, under the deploy lock.
3. Keep **exactly one** `proxy_pass http://127.0.0.1:<3000|3012>;` and **exactly one** `alias /var/www/...;`. `anshkosh-route` refuses to switch ports otherwise, which breaks the next deploy.
4. Keep the apex → www redirects, the TLS lines and `client_max_body_size 6m`.
5. `nginx -t`, and only if that passes, `systemctl reload nginx`. If it fails, restore the backup.
6. Verify from outside with `curl -sI`.

Example: the 6 October 2026 apex → www redirect. Backup: `/var/lib/anshkosh-routing/nginx-manual-apex-20261006T071606522005.conf`.

## Release cleanup

Handled automatically by `anshkosh-prune-releases.timer`. To run it now:

```bash
systemctl start anshkosh-prune-releases.service
journalctl -u anshkosh-prune-releases -n 20
```

To keep more releases, set `ANSHKOSH_KEEP_RELEASES` (minimum 2) with a systemd drop-in for the service. Never delete release directories with a wildcard, and never delete the release named in `current.json`.

## Disk filling up

Check in this order: `du -sh /var/www/anshkosh-releases/*` (should be about 4 releases × 2 GB), `/var/www/anshkosh-shared/backups/` (no automatic purge), `/home/deploy/.pm2/logs` and `/var/log/nginx`. Deleting backups needs owner approval.

## TLS certificate

`certbot-renew.timer` renews automatically; the current certificate expires 30 Dec 2026. Check with `systemctl status certbot-renew.timer` and `journalctl -u certbot-renew`. Test with `certbot renew --dry-run`.

## Things that always need the owner's approval

- Restoring, resetting or dropping the production database, or running destructive migrations
- Deleting backups or log history
- Adding, removing or changing SSH keys, sudo rules, firewall rules or root access
- DNS, mail or TLS policy changes
- Granting admin roles or changing user accounts
- Rotating credentials or the backup encryption key
- Replacing root-owned deploy or ops helpers
- Buying capacity or add-ons
- Restarts that will cause downtime
