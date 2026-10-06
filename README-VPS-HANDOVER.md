# Anshkosh VPS handover for Arush

Prepared: 2 October 2026 (India time). This is a record of the completed VPS work, not a fresh load test or a guarantee against future outages. No passwords, private keys, API tokens or database connection strings are included.

## Summary

- Production now runs on the existing VPS at `66.116.248.164`, under the `deploy` user, with PostgreSQL, authenticated Redis, PM2 and Nginx.
- `anshkosh.com` and `www.anshkosh.com` point to this VPS. Vercel is no longer serving the production domain.
- The VPS was initially serving the old Arush repository checkout. We deployed the updated website from `l3ad3r1/Anshkosh` and added automatic deployment from its `main` branch.
- We diagnosed and repaired a Redis configuration/retry problem in the PM2-managed processes. We did **not** establish a defect in PM2 itself.
- One dedicated, restricted SSH deployment key was added. Existing SSH keys and the production database were preserved.

## 1. PM2 resource outage: what we found

### Confirmed diagnosis

PM2 had retained an **invalid Redis port in its process settings**. The workers repeatedly attempted unsuccessful Redis connections, producing high CPU usage and rapidly growing error logs.

The useful distinction is that PM2 was managing processes with bad/stale configuration; there was no confirmed PM2 software bug or proven memory leak in PM2. The retry/logging loop explains the resource pressure observed during diagnosis. We cannot retrospectively prove that it explains every earlier outage without historical metrics and kernel logs.

There was also a configuration-order hazard in the worker entry points: imported modules initialize Redis before the body of the entry point calls `process.loadEnvFile()`. The corrected PM2 command loads `.env` **before** those imports execute. This prevents missing or stale Redis settings from being used during initialization.

### Changes made

- Cleared/recreated the affected PM2 processes instead of relying on a restart that could retain stale process environment settings.
- Started the website and the three workers with the correct production configuration and working directory.
- Changed worker execution to Node with `--env-file=.env --import=tsx`.
- Explicitly set `NODE_ENV=production` for the workers; the application selects Redis database 0 in production.
- Added restart safeguards: minimum uptime 10 seconds, maximum 10 unstable restarts, and exponential restart backoff starting at 1 second.
- Set PM2 memory-restart thresholds: 512 MB for the web process and 256 MB per worker. These are restart thresholds, **not** hard operating-system memory limits.
- Bound the web server to loopback, behind Nginx.
- Verified the `pm2-deploy` systemd service and saved the PM2 process list for reboot recovery.
- PM2 log rotation was present and running at the final service check. Periodic disk/log review is still needed.

Configuration source: [ecosystem.config.js](ecosystem.config.js).

### Verification and limits

After the initial repair, all four application processes were online with zero restarts, worker error logs stopped growing, and about 2.5 GB of memory was available. PostgreSQL and authenticated Redis connectivity worked.

After the final automatic deployment, the web process and all three workers remained online with zero restarts at the roughly five-minute follow-up. Approximate memory use at that snapshot was 263 MB for the web process and 113–115 MB per worker.

These were short operational checks, not a sustained production load test. If the problem recurs, capture process restart counts, CPU/memory, log growth, Redis connectivity and kernel OOM events before restarting anything. Check effective worker configuration without exposing credentials.

## 2. Server and backend changes

| Component | Result of the work |
| --- | --- |
| Operating system | Existing AlmaLinux 8.10 VPS retained; approximately 3.66 GB usable RAM. |
| Runtime | Deployment uses Node 22.23.2 at `/home/deploy/.nvm/versions/node/v22.23.2/bin`. |
| PostgreSQL | Identified the actual production service as `postgresql-15`, not the generic `postgresql` unit. Existing PostgreSQL 15.19 cluster, `anshkosh` database and role were reused; no production reset or replacement. The unused PostgreSQL 16 service was left inactive. |
| Redis | Existing authenticated Redis reused on loopback port 6379. Corrected application/worker connection configuration; no public Redis endpoint introduced. |
| PM2 | PM2 7.0.4 runs the web process and three workers as `deploy`; `pm2-deploy` is enabled for startup recovery. |
| Nginx | Existing Nginx 1.14.1 configured for the domain, HTTPS, loopback application proxy and shared built assets. Configuration tested before reloads. |
| Database migration | Backed up the database, then applied the new newsletter migration `20260920120000`. All eight migrations were applied at the deployment check. |
| Application configuration | Corrected public/canonical URL settings from the VPS IP to `https://www.anshkosh.com`. Preserved existing production credentials in private environment files. |
| Rendering | Fixed startup/category slug rendering conflicts that returned server errors for missing pages; proper 404 responses verified. |

PostgreSQL remains on loopback port 5432. The generic service checks initially gave a misleading impression because the database uses a version-specific service name.

No claim is made here that every operating-system package was upgraded, that a comprehensive firewall audit was completed, or that every backend business workflow was tested end to end.

## 3. DNS, HTTPS and mail

- Updated the website records in **Spaceship**, the authoritative DNS provider: apex and `www` A records point to `66.116.248.164`, with a 300-second TTL.
- Issued and installed a Let's Encrypt certificate covering `anshkosh.com` and `www.anshkosh.com`.
- Certificate files are under `/etc/letsencrypt/live/anshkosh.com/`; the private TLS key is not in GitHub or this document.
- HTTP redirects to HTTPS. Certificate renewal was tested and `certbot-renew.timer` enabled.
- Removed the temporary ACME DNS verification records after certificate setup.
- Preserved the existing mail MX, SPF and DKIM records. We did **not** replace them with the generic hosting-panel mail recommendations.
- Mail forwarding and the application's email provider are separate services. The VPS deployment checks do not constitute a new end-to-end delivery test for `hello@anshkosh.com` or the application's transactional emails.

The certificate expiration observed during setup was 30 December 2026; future renewal status must be checked on the server.

## 4. Automatic GitHub-to-VPS deployment

Repository: [l3ad3r1/Anshkosh](https://github.com/l3ad3r1/Anshkosh).

Publishing flow:

```text
Local edits / Anshkosh-Website/Rinu
                |
        push or merge to main
                |
       GitHub Actions tests
                |
      restricted SSH transfer
                |
   VPS tests, backup, migration, build
                |
       checked candidate release
                |
    Nginx switch + worker/public checks
                |
       save successful release state
```

Local edits and pushes to `Anshkosh-Website/Rinu` do **not** publish until they reach `main`. Pull requests run tests only. A manual workflow run on `main` is also supported.

Workflow: [.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml). Operational details: [deploy/README.md](deploy/README.md).

### Deployment safeguards added

- GitHub Actions uses pinned action revisions, Node 22 and Ubuntu 24.04 runners.
- Tests run on GitHub and again on the VPS. The VPS test subprocess uses `NODE_ENV=test`; an initial production-mode test failure was fixed before successful publication.
- The exact tested Git commit is transferred; no broad GitHub access token is stored on the VPS.
- Each build uses a new release directory. The currently serving site remains online during dependency installation, testing and building.
- Deployments are serialized with a server-side lock. Build Node heap is set to 1536 MB and tests use two workers to limit pressure; this is not a hard cap on total build memory.
- A PostgreSQL custom-format backup is created and its archive listing validated before migration. This is **not** a restore rehearsal.
- Pending migrations pass a conservative additive-SQL check. Destructive/data-changing migrations are blocked for manual review. SQL screening does not prove application-level backwards compatibility; Arush must still review migrations.
- Candidate web processes alternate between loopback ports 3000 and 3012.
- Database health, exact release identity, page/SEO checks, proper 404s, JS/CSS asset availability and worker startup stability are checked.
- Hashed static assets are retained in a shared directory so older browser tabs can still load their assets. Public asset permissions were corrected without making environment files public.
- A failure before the success checkpoint retains/restores the previous web release and workers. Database migrations are **not** automatically reversed or restored over current data.
- PM2 process state and the successful release marker are saved. Old releases and backups are retained for recovery.
- Root-owned deployment helpers are **not** automatically replaced by uploaded repository code; helper changes require a reviewed server installation.
- The old in-place `deploy/deploy.sh` publishing path now refuses to run and directs operators to the checked deployment workflow.

### Verified deployment

- Commit: `7abf29fd85b11b810e66ab28906529ff96f9b48d`.
- Successful workflow: [GitHub Actions run 36941129066](https://github.com/l3ad3r1/Anshkosh/actions/runs/36941129066).
- The full pipeline was verified through a **manual workflow run**; the same workflow is enabled for future pushes to `main`.
- All 37 tests passed on both GitHub and the VPS. Public health/SEO checks and all 17 referenced built assets passed.
- The public release marker was rechecked while preparing this document and still reported that commit: [release.json](https://www.anshkosh.com/.well-known/release.json).
- The construction notice/curtain reveal and both supplied artwork images were checked on the live site during deployment.

## 5. Keys and permissions added

### Dedicated SSH deployment key

One Ed25519 key was created specifically for GitHub Actions, with comment `github-actions-anshkosh`.

- **Private key:** encrypted repository Actions secret `VPS_SSH_KEY`. Never committed to Git, included in this document, or copied to the VPS.
- **VPS public key:** appended to `/home/deploy/.ssh/authorized_keys`, preserving existing entries.
- **Restriction:** forced command `/usr/local/libexec/anshkosh-receive`, with the OpenSSH `restrict` option.
- **Allowed commands:** `check` and `deploy <40-character lowercase commit SHA>` only.
- **Blocked:** ordinary remote shell commands, PTY, port forwarding and agent forwarding. An attempted `whoami` command was explicitly rejected during verification.
- **Temporary local copy:** the private-key staging copy was deleted after installation/testing. Workflow runner temporary key files are also removed on exit.
- **Scope caveat:** this is a deployment key, not read-only access. It can install application code that runs as `deploy`; protect GitHub write access and workflow changes accordingly.

Public key for identification/revocation (public, not a secret):

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAthGhHFyzsuIZWnW9+HFB8vO6jZj0SsnDKerF446rnT github-actions-anshkosh
```

Authorized-key options applied to that entry:

```text
restrict,command="/usr/local/libexec/anshkosh-receive"
```

The existing authorized-keys file was backed up to `/root/anshkosh-authorized-keys-before-automation` when adding the entry. No unrestricted root-login key was created and no VPS login password was put into GitHub.

### SSH host verification

`VPS_KNOWN_HOSTS` pins the existing server's Ed25519 host key. Its fingerprint was verified against the authenticated VPS console:

```text
SHA256:VBVYKtdbFnMB900C8S2MFaEk3cKmWoDZE/KaOluE1cg
```

This host key identifies the VPS; it is **not** the new deployment key. Do not disable host-key checking to resolve connection errors.

### Restricted privileged routing permission

Added `/etc/sudoers.d/anshkosh-routing`, validated with `visudo`, allowing only:

```text
deploy ALL=(root) NOPASSWD: /usr/local/sbin/anshkosh-route 3000, /usr/local/sbin/anshkosh-route 3012
```

This root-owned helper changes only the intended Nginx application route/static alias, tests configuration and reloads Nginx, restoring its configuration if the operation fails. Application installation/builds/migrations/PM2 do not run as root.

The pre-existing password-required administrative sudo access for `deploy` was not replaced with general passwordless sudo.

### GitHub settings

| Type | Name | Purpose |
| --- | --- | --- |
| Secret | `VPS_SSH_KEY` | Dedicated deployment private key. |
| Secret | `VPS_KNOWN_HOSTS` | Pinned SSH host identity. |
| Variable | `VPS_HOST=66.116.248.164` | Deployment target. |
| Variable | `VPS_USER=deploy` | Deployment account. |
| Variable | `VPS_DEPLOY_ENABLED=true` | Enables publishing from `main`. |

To rotate the deployment key: generate a replacement, add its public key with the same restrictions, replace `VPS_SSH_KEY`, verify a deployment, then remove only the old matching authorized-key entry. Do not overwrite the file or remove Arush's other access keys.

If compromised, immediately disable new deployments, cancel any in-flight deployment workflow, and revoke the matching public-key entry using existing administrative access. Revocation does not terminate an already running session; inspect active deployment processes as well. Review repository changes and access before restoring automation.

## 6. Server file layout and recovery material

| Path | Purpose |
| --- | --- |
| `/var/www/anshkosh` | Original checkout preserved, including unrelated existing local changes. Not the current publishing target. |
| `/var/www/anshkosh-releases/<SHA>.<suffix>` | Separately built application releases. |
| `/var/www/anshkosh-releases/4a23eb0` | Earlier manually deployed release retained for recovery. |
| `/var/www/anshkosh-shared/.env` | Production settings, owned by `deploy`, mode 600. Each release receives a private copy. |
| `/var/www/anshkosh-shared/state/current.json` | Saved successful commit, release directory, port and web process name. |
| `/var/www/anshkosh-shared/backups/` | Private database dumps, files mode 600. |
| `/var/www/anshkosh-shared/static/` | Retained public hashed browser assets, directories 755/files 644. |
| `/var/www/anshkosh-shared/incoming/` | Private temporary deployment archive staging. |
| `/usr/local/libexec/anshkosh-receive` | Root-owned forced SSH command/receiver. |
| `/usr/local/libexec/anshkosh-validate-archive` | Rejects unsafe archive entries before extraction. |
| `/usr/local/libexec/anshkosh-deploy.mjs` | Root-owned deployment orchestration, executed as `deploy`. |
| `/usr/local/libexec/deployment-policy.mjs` | Migration screening policy. |
| `/usr/local/sbin/anshkosh-route` | Root-owned restricted Nginx routing helper. |
| `/etc/nginx/conf.d/anshkosh.conf` | Domain HTTPS/proxy/static configuration. |
| `/var/lib/anshkosh-routing/` | Root-private Nginx routing backups. |
| `/home/deploy/.pm2/` | PM2 state, saved process list and logs. |
| `/root/anshkosh-release-transfer-20261002/` | Initial database/configuration recovery material; validated database dump retained. |
| `/root/anshkosh-automation-bootstrap-20261002/` | Protected deployment-helper installation material. |

At handover, the active release directory was:

```text
/var/www/anshkosh-releases/7abf29fd85b11b810e66ab28906529ff96f9b48d.WkaExhhN
```

Its web process was `anshkosh-web-3012`. Workers are `worker-email`, `worker-notification` and `worker-sync`. Future deployments alternate the web port/name; read `state/current.json` instead of assuming port 3012 is permanent.

## 7. Routine checks and safe recovery

For administrative checks, use Arush's normal server access or the hosting console, **not** the restricted deployment key. Run PM2 as `deploy`; do not accidentally create a separate root PM2 daemon.

Read-only checks from an administrative shell:

```bash
systemctl is-active nginx postgresql-15 redis pm2-deploy certbot-renew.timer
sudo -iu deploy pm2 status
sudo -iu deploy cat /var/www/anshkosh-shared/state/current.json
curl --fail --silent --show-error https://www.anshkosh.com/api/cron/health
curl --fail --silent --show-error https://www.anshkosh.com/.well-known/release.json
df -h /
free -m
sudo journalctl -k --since '24 hours ago' --no-pager | grep -Ei 'out of memory|oom|killed process'
```

Do not share `.env`, raw `pm2 jlist` output, PM2 environment dumps, saved PM2 dumps or unredacted logs: they may contain secrets.

To pause future publishing, set GitHub variable `VPS_DEPLOY_ENABLED=false`. This does not stop the live site or cancel an already running workflow; cancel an in-flight run separately if necessary.

For manual rollback, retain the current release and database backup first. Identify the last healthy release and its port, start/check its web process, switch with `sudo /usr/local/sbin/anshkosh-route <3000-or-3012>`, and restore its workers from its `deploy.runtime.config.json` (or the earlier baseline's `ecosystem.config.js`). Verify public health/assets and save PM2. Reconcile the saved release-state marker with the chosen release before re-enabling automation. These are coordinated recovery steps, **not** a one-command rollback.

Do **not** automatically restore a database dump over current production data. Review data loss and schema compatibility separately. Do not use a hard Git reset on the preserved original checkout or delete releases/keys indiscriminately.

## 8. Remaining follow-up work

- Review dependency security advisories: the installation reported 16 advisories, including one critical. They were not automatically fixed or forced through an upgrade.
- Add sustained uptime/resource monitoring and alerts. The startup and five-minute checks are not continuous monitoring.
- Define release, database-backup and shared-static retention. Nothing currently removes old releases/backups automatically; disk accumulation remains a risk. Add off-server backups and rehearse restoration.
- Review Redis retry behavior for future failures, not just process restarts: PM2 backoff cannot stop every retry loop inside a still-running process.
- Require migration review, especially changes that affect old/new application compatibility. The automatic gate intentionally rejects many changes requiring manual maintenance.
- Keep Node, operating-system packages and root-owned deployment helpers maintained. A Node path upgrade requires updating the installed receiver.
- Consider protecting `main` and requiring review for workflow/deployment changes; branch protection was not established in this handover.
- Test transactional email delivery and other user/account workflows separately if release acceptance requires them.

**Bottom line for Arush:** we repaired stale/invalid Redis configuration and the resulting retry/log-growth problem in PM2-managed workers, stabilized the application, moved the updated site onto the existing VPS, and added checked automatic deployment with a restricted key. We did not prove a PM2 product bug or rule out every possible future resource issue.

## 9. Follow-up: separate maintenance SSH access — 2 October 2026

The user separately approved administrative SSH access for maintenance. This is **not** the restricted GitHub deployment key described above.

- A new Ed25519 key named `anshkosh-maintenance-renja-20261002` was generated on the user's laptop, outside the repository. Its private file has explicit Windows permissions for the local owner, SYSTEM and Administrators, without inherited access. It has no passphrase: protect the laptop/account and treat the file as a root credential. No private key was uploaded to the provider, VPS or GitHub.
- Public fingerprint: `SHA256:Q+1hF9Q9vie6Px6ccDE/L9H8Tz0KRJC6MoJ+i4hGqoM`.
- The hosting panel displayed Installed, but root's authorized-key file did not contain this key. Server diagnostics confirmed `permitrootlogin yes`, `pubkeyauthentication yes`, and `.ssh/authorized_keys` as the configured file.
- After explicit approval, `/root/.ssh/authorized_keys` was backed up to `/root/.ssh/authorized_keys.before-maintenance-20261002`, preserving ownership/permissions. Only the new public-key entry was appended; the existing ECDSA key remained present. Root's directory/file retained modes 700/600.
- The new entry disables agent, port and X11 forwarding. It still grants unrestricted root shell administration; those forwarding options do not sandbox root commands. The deploy user's keys, forced command, routing permissions and SSH daemon configuration were not changed.
- Verified from the laptop with the new key only, password fallback disabled, and strict checking of the saved Ed25519 server host key: `id -u` returned `0`, hostname was `anshkosh.com`, and PostgreSQL 15, Redis and Nginx were active. Memory was 3,663 MiB total / 2,425 MiB available; swap use was zero. No production service was restarted for this change.

To connect from this laptop:

```powershell
ssh -i C:/Users/renja/.ssh/anshkosh_maintenance_20261002 -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o HostKeyAlgorithms=ssh-ed25519 root@66.116.248.164
```

If authentication fails again, use the logged-in provider console to inspect the effective SSH settings and authorized-key fingerprints; do not disable host checking or overwrite the file. To revoke access, first keep a working root console/another authorized session, back up the current file, and remove only the exact maintenance entry matching the fingerprint/comment above. Preserve all other entries and any additions made since the backup; do not blindly restore an old file. Confirm a new maintenance-key login fails while Arush's access still works. Remove the provider's matching entry as well to avoid later reinstallation. Local/private-key cleanup should follow confirmed revocation, not precede it.

Antivirus, the pending upload-safeguards release, new operations timers, off-site backups and the requested website admin grant were **not** enabled by this SSH-access change. See `deploy/LAUNCH-SAFEGUARDS.md` for their prerequisites and remaining verification.

## 10. Follow-up: operational backups, alerts and website admin — 2 October 2026

This later maintenance step supersedes the earlier pending status for operations tooling and admin access. It did not deploy the pending website safeguards or install antivirus.

- Root-owned operations modules were installed at `/usr/local/libexec/anshkosh-operations/`, with `/usr/local/libexec/anshkosh-ops` as the fixed helper. Services run as `deploy`, with private temporary storage, restrictive permissions, a 768 MiB memory ceiling and a ten-minute timeout. The deployment key was not widened.
- The shared environment was privately backed up before adding `OPS_ALERT_EMAIL=anshkosh@gmail.com`, a new random backup-encryption key and `OPS_SCANNER_MODE=deferred`. Existing application/database/Redis/provider credentials were preserved, and `.env` remains mode 600, owned by `deploy`. No key value is recorded here or in Git.
- A PostgreSQL custom-format dump was validated, AES-256-GCM encrypted, uploaded to the existing R2 bucket's `private-backups` prefix and downloaded/authenticated. No separate backup bucket was purchased or configured. Public-access settings of the existing bucket have not been independently confirmed.
- The downloaded encrypted backup was decrypted and restored into a separate temporary PostgreSQL instance using a private Unix socket and no TCP listener. Application tables were queried successfully, and the test instance/directory were stopped/removed. Production was not restored, dropped or reset. The same backup, restore and health jobs also passed when run through the installed systemd services.
- Timers are enabled: backups daily at 02:30 and isolated restore checks Sundays at 04:00, with up to five minutes of jitter; health checks run every five minutes. Calendar schedules follow the existing VPS timezone, **America/Denver**, not India time. As of this date the daily backup is approximately 14:00 IST before jitter; the conversion changes with Denver daylight-saving time. The server timezone was not changed.
- Checks cover public/database health, Redis, PM2 web/workers, disk space, available memory (below 10% or 256 MiB) and sustained 15-minute load (above twice the CPU count), plus backup/restore freshness. Email failures are repeated at most every six hours and recovery is reported. Alerts use the existing Brevo account; a test was accepted by the provider, but recipient inbox delivery still requires confirmation.
- Antivirus remains explicitly deferred. Once a release containing the scanner-dependent upload code is published, checks require a healthy scanner regardless of that deferred setting. Do not deploy those upload routes before scanner approval/capacity and real-engine tests.
- The encryption key has a separately verified, Windows DPAPI-protected recovery copy at `C:/Users/renja/.ssh/anshkosh_backup_recovery_20261002.clixml`, outside Git, with restrictive permissions. It is tied to that Windows account/machine; it is not a portable password-manager backup. Arrange an independently protected portable recovery copy before relying on recovery after laptop loss. Never paste the key into chat or documentation.
- At the owner's revised request, **`anshkosh@gmail.com`** was found to be an existing verified, non-banned website account and granted the `admin` role after a fresh verified backup. Only this account's sessions were revoked; its password was unchanged. Sign in again at `/admin/login`. The earlier requested Rinu account was not granted access.
- Independent external uptime automation remains prepared locally, not confirmed active on GitHub main. VPS-local alerts cannot report a complete VPS/network outage. Local database dumps are retained without automatic purging; encrypted upload currently limits dumps to 256 MiB.
- The Acronis panel inspected afterward showed `Not protected`, no last/next backup and a 10 GB storage allowance. The customized protection plan was still unsaved at inspection. An active hosting add-on is not evidence of a completed server backup; confirm actual protection/jobs independently.

Operational source and earlier environment/module recovery material remain privately on the VPS. The current production release is `149866d8b198909c92164c460677e0468a9d989a.BiTp0mS6`, with `anshkosh-web-3000`. Local verification now totals 159 passing unit tests and a successful TypeScript check; earlier isolated browser/build verification is described in the launch runbook.

## 11. Follow-up: approved disk cleanup — 2 October 2026

Owner: Arush / VPS operator. One-time manual cleanup; **no automatic deletion policy was enabled**. The user explicitly approved removing old log archives and unused releases while preserving the running site, a verified rollback and the original checkout.

Before deletion, the previous release was started temporarily as `deploy` on **127.0.0.1:3014** (not publicly routed). Database health, homepage, login, discover and commit identity passed. The probe was stopped before cleanup; normal PM2 processes were not replaced or restarted. Live/saved PM2 references and open process files were checked against the removal targets.

The cleanup held the same `deploy.lock` used by automatic deployment. It used an explicit allowlist, canonical paths, no symlinked release roots, filesystem/mount checks, file identity checks and fresh public health checks. Current/rollback releases were excluded. It did not use a wildcard recursive delete.

Removed permanently:

- **81 older rotated PM2 log archives**, totaling 11,655,756,134 bytes. The latest archive for each of 11 log streams, plus all active logs, was kept. Removed logs are not locally recoverable; no claim is made that Acronis backed them up.
- Four unused release directories: `4a23eb0`, `74972014d401fbea7d9500ff326f62f1bd1f4b11.Siq54jXU`, `7abf29fd85b11b810e66ab28906529ff96f9b48d.WkaExhhN`, and `a221a29bbfeacf4c4d0ab7625885a51c5b61df6a.8DMOYsru`. Their source commits remain available in the local Git history; a deleted built directory must be rebuilt, not treated as an immediately runnable rollback.

Preserved:

- Current release: `/var/www/anshkosh-releases/149866d8b198909c92164c460677e0468a9d989a.BiTp0mS6`.
- Verified previous release: `/var/www/anshkosh-releases/1b125464f54ad4f2ee8fcf8d34d3c00154c9fabb.o5pzk9Xd`.
- Original checkout `/var/www/anshkosh`, including existing local changes.
- PostgreSQL/Redis data, all database/configuration backups, shared hashed browser assets, production settings, SSH keys and operational services.

Filesystem use fell from **37,370,335,232 to 18,326,159,360 bytes**: approximately **17.7 GiB reclaimed**, from **34.8 GiB to 17.1 GiB**, **38% → 19%**. The final `df -h` rounds upward and displays **35G → 18G**, with **77G available**. PM2 logs now occupy about 16 MiB and the two retained releases about 3.8 GiB. Homepage/login, database health, current release identity and all discovered homepage static assets passed after cleanup. Web/worker PIDs and restart counts were unchanged.

Audit manifest and completion record: `/root/anshkosh-space-cleanup-20261002/plan.json` and `result.json`, root-private. Reviewed source: `deploy/cleanup-space.mjs`; the one-time report/allowlist intentionally prevents blind repeat execution. A later cleanup requires a newly reviewed plan against the then-current deployment and rollback.

For follow-up, inspect disk use and the existing five-minute operations checks. If any page/asset fails, stop additional cleanup and escalate to Arush; do not restore production database data automatically. Use the preserved verified release and the coordinated routing/worker rollback procedure above if a website rollback is needed. Even after cleanup, 10 GB Acronis storage is not confirmed sufficient for a full-machine image plus retained history; check actual backup sizing before applying a plan or purchasing capacity.
