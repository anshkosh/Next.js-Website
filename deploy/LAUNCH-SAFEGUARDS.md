# Anshkosh launch safeguards — operator runbook

Owner: Arush / VPS operator. Prepared 2 October 2026. Server installation and a real restore test must be verified; source files alone do not confirm either.

## Website changes

- Device-only recovery copies for startup creation, editing and founder details. Copies are scoped by signed-in account and startup, expire after seven days, and are offered for explicit restoration rather than silently replacing server content. They are not cross-device saves and do not publish anything. Avoid shared computers.
- Live startup edits are stored in `StartupRevision`. The published profile and slug remain live. Admin moderation compares published/proposed content and checks the exact reviewed version, so newer edits cannot be accidentally approved. Rejection preserves the live version. Founder-manager saves remain separate, immediate operations.
- Deck visibility defaults to private for new decks; previously uploaded decks retain their documented public behavior. Private downloads are restricted server-side to the verified owner and verified admin/reviewer. Only a public deck attached to a LIVE profile can be downloaded anonymously. Deck responses are not cached. Making a deck private/removing it revokes public access immediately on saving, even while other edits await approval. Copies previously downloaded cannot be recalled.
- Startup stage options now include concept validation, preparing/running a pilot, launched and growing. Old values still work.
- Profile uploads require verified, non-banned accounts and exact trusted origins. Limit: 20 attempts/hour, 100 MB stored/day and 500 MB tracked storage/account. New stored objects count toward the quotas; legacy untracked media is not retroactively counted. Removing a reference does not delete its object or reset the allowance. Contact support if full.
- In `"clamav"` mode (see "Current upload checks" below for the interim mode) every new startup logo, gallery/founder photo and deck is scanned via loopback ClamD before storage. Images are also decoded/re-encoded. Scanning fails closed: unavailable scanner means retryable upload errors, not unchecked uploads. Antivirus is layered protection, not a guarantee. Journal and founder-update upload routes are outside this profile-specific scanner rollout.
- Additive migration `20261002060000_profile_safeguards` adds two tables. No existing IDs/data are rewritten. The previous release remains compatible for rollback.

## Current upload checks: sanitize-only mode (ClamAV pending)

ClamAV is **not installed** on the VPS: the installer needs about 5 GiB of available RAM and the host has 3.66 GiB. Until the server is resized, `lib/uploads/scan-mode.ts` is set to `"sanitize-only"`. In this mode there is **no antivirus and no signature-based malware detection**. The controls are:

- Images: type and size limits, decoded and re-encoded to WebP by sharp (metadata and embedded payloads are not stored).
- PDFs: rejected if they contain scripts, launch/submit actions, attachments or XFA (`lib/uploads/pdf-safety.ts`), rewritten from parsed objects by pdf-lib, then validated with `qpdf --check` (any error or warning rejects the file) and rewritten by qpdf. Data hidden after `%%EOF` is not stored.
- Unchanged: verified-account and trusted-origin checks, rate limits and storage quotas, private/public deck rules.

**Install qpdf on the VPS before deploying this release** (AlmaLinux 8 AppStream, currently 7.1.1): `dnf install qpdf`. Without it PDF uploads fail closed with a retryable 503 and the five-minute operations check reports "qpdf is not installed".

The operations check treats ClamAV as not required while `UPLOAD_SCAN_MODE` is `"sanitize-only"`. `deploy/operations.mjs` runs from the root-owned copy in `/usr/local/libexec/anshkosh-operations/`, so this behaviour needs a reviewed install of that helper.

**Switching to ClamAV later:** resize the VPS to about 8 GiB, run `bash deploy/install-safeguards.sh`, confirm loopback-only port 3310, run `deploy/check-scanner.mjs` (clean file and EICAR must both pass), then change `lib/uploads/scan-mode.ts` to `"clamav"` and deploy. ClamAV scanning, fail-closed, is then enforced again for every upload and the monitor requires it.

## Before publishing

1. Run unit tests/type checks and the isolated Playwright workflow. Browser tests use a disposable PostgreSQL database named `anshkosh_e2e`, Redis DB 1, captured mail, local S3 and simulated ClamD protocol. No real accounts/mail/storage or production database. This verifies token delivery through the email worker, not Gmail deliverability or antivirus detection quality. Older placeholder browser specs are not counted as passing tests.
2. In the VPS root terminal inspect memory/disk first. The installer refuses below 5 GiB available RAM: 4 GiB for ClamD plus 1 GiB for signature updates/operating headroom, in addition to current application use. ClamAV recommends 3–4 GiB for scanning; the earlier 2 GiB service limit has been raised to 4 GiB. If insufficient, provision resources or use a dedicated scanner; do not remove the capacity guard. Reference: https://docs.clamav.net/ and https://docs.clamav.net/manual/Installing/Docker.html.
3. Copy this reviewed deployment directory to the VPS before main is updated. Run `bash deploy/install-safeguards.sh`. This adds only Anshkosh-specific service files, installs EPEL ClamAV packages, binds scanning to 127.0.0.1:3310 and updates signatures. Existing files cause a stop for manual comparison. It does not edit PostgreSQL/Redis/Nginx settings or widen the deployment key.
4. Confirm `systemctl status anshkosh-clamd` and `ss -ltnp` show loopback-only 3310. Run `/home/deploy/.nvm/versions/node/v22.23.2/bin/node deploy/check-scanner.mjs` from the supplied source directory. It sends clean input and the official harmless EICAR fixture directly to loopback ClamD without writing either to disk or application storage. Both expected verdicts must pass. Then confirm a genuine PDF/photo is accepted after publication. Keep signatures updated.
5. Use the existing backed-up automatic deployment to apply the additive migration and publish. Verify the release identity and a genuine authenticated photo/deck upload before calling the rollout complete.

## Encrypted off-site backup and alerts

In `/var/www/anshkosh-shared/.env` add:

```dotenv
OPS_ALERT_EMAIL=anshkosh@gmail.com
BACKUP_ENCRYPTION_KEY=<64 hex characters generated on the VPS>
# Optional dedicated bucket; otherwise use the existing R2 bucket:
BACKUP_R2_BUCKET=<private bucket with read/write access>
```

The user confirmed `anshkosh@gmail.com` as the alert recipient on 2 October 2026. This is the intended configuration, not confirmation that alerts are enabled or delivered.

Generate the encryption key with `openssl rand -hex 32` in the VPS terminal. Never paste it into chat or Git. Keep a separate recovery copy in a password manager; without it, encrypted backups cannot be restored. Retain `.env` ownership `deploy:deploy`, mode 600. Existing R2 and Brevo credentials are reused; these operations scripts do not introduce a new SSH/deployment key. A separately approved maintenance key was later installed and verified; see the handover follow-up below.

Disable R2 public-development URLs/custom public bucket domains. All application media should use the server handler. Otherwise direct bucket URLs bypass deck privacy, even though backups are encrypted. The serve handler explicitly refuses the `private-backups` prefix.

After publishing, run these from the VPS root terminal:

```bash
runuser -u deploy -- /usr/local/libexec/anshkosh-ops backup
runuser -u deploy -- /usr/local/libexec/anshkosh-ops restore-test
runuser -u deploy -- /usr/local/libexec/anshkosh-ops test-alert
runuser -u deploy -- /usr/local/libexec/anshkosh-ops check
systemctl enable --now anshkosh-backup.timer anshkosh-restore-test.timer anshkosh-check.timer
```

Expected: a custom-format dump is validated, AES-256-GCM encrypted, uploaded off-site and downloaded/authenticated. The restore test runs as deploy and creates a separate temporary PostgreSQL instance with a private Unix socket and no TCP listener. It decrypts the off-site object, restores a randomly named test database and queries application tables. It stops the instance and removes only its guarded temporary directory before recording success. No root or production CREATEDB rights are needed; production and retained backups are untouched. A successful catalog listing alone is not a restore test. Local backups are retained; no automatic purge is enabled. Review capacity regularly. Encrypted upload currently caps dumps at 256 MB; larger databases need streaming before the cap is reached.

Confirm receipt of the test alert. Provider acceptance is not proof of inbox delivery. The monitor checks public availability, database, Redis, PM2 workers, antivirus/signature age, disk, backup freshness and weekly restore freshness. It repeats unresolved alerts no more than every six hours and reports recovery. Daily/weekly times follow the VPS system timezone, not the browser timezone.

The GitHub external uptime workflow checks outside the VPS every ten minutes after it reaches main. Enable GitHub Actions failure email notifications in the repository account; otherwise a failed job is visible but inbox alerts are not guaranteed. Scheduled runners may be delayed and this is not a contractual uptime service. The VPS cannot email during a complete server/network outage, hence the independent check.

## Requested administrator account

The authorized target is now `anshkosh@gmail.com` (changed by the owner on 2 October 2026, replacing the earlier Rinu address). Email verification is required before granting admin access. Any newly requested account must use the normal verification/password-reset flow; never a shared or default password.

```bash
/usr/local/libexec/anshkosh-ops check-admin
/usr/local/libexec/anshkosh-ops grant-admin
```

The grant requires root, takes a verified off-site backup, checks the exact active account inside a transaction, updates only its role and revokes its sessions so the next login picks up the new permission. Password is unchanged. Then sign in again at `/admin/login` and check moderation. Execution, not just preparation of this command, is required to confirm access.

## Troubleshooting and rollback

- Upload 503: scanner/Redis protection unavailable. Check `journalctl -u anshkosh-clamd`, signature updates and loopback connectivity. Do not disable scanning to force upload success.
- Upload 413: Nginx must keep its existing 6 MB multipart allowance; PDF limit remains 5 MB, logo/founder limit 2 MB.
- Upload 429: per-account rate/storage budget reached. No silent unlimited fallback.
- Review says reload: a newer revision was submitted. Compare the new content before approving.
- Alerts missing: verify recipient, Brevo sender/domain, provider logs and inbox. Never print provider keys.
- Inspect `journalctl -u 'anshkosh-ops@*' -u anshkosh-restore-test` for operational failures. No secrets should be included in reports.
- Pause timers with `systemctl stop anshkosh-check.timer anshkosh-backup.timer anshkosh-restore-test.timer`. Keep backups, encryption key and scanner available.
- Roll back the website using the existing retained release/routing procedure. Do not reset or drop production data/tables. Earlier website releases publicly serve decks: reverting that route removes privacy enforcement, so block deck downloads until a privacy-aware release is restored.

## Verification still required

Local verification on 2 October: 149 unit tests, three complete Chromium browser tests (signup/verification/login, profile/media submission and admin review/recovery/privacy, password reset/mobile layout), three Nginx configuration tests, a complete production build including type checks, and an isolated database migration passed. These browser tests use captured services and disposable data, not production email delivery, R2 or an actual antivirus engine. The restored-database safety and encryption tests cover failure/cleanup/tampering, but do not replace a real VPS off-site restore.

Production rollout remains pending. The reopened VPS console disconnected before capacity/service checks returned; no scanner installation, operations environment configuration, timer activation or administrator grant was verified in this session. Do not publish the fail-closed upload routes until the real scanner has passed its checks.

Follow-up preflight on 2 October: the logged-in root console reported 3,663 MiB total memory, 2,460 MiB available, 2,047 MiB unused swap, and 59 GB free disk space (38% used). PostgreSQL 15, Redis and Nginx were active. `/usr/local/libexec/anshkosh-ops` and the new Anshkosh systemd service files were absent. No privileged setup was performed: console input began repeating characters during the PM2 check, so input was stopped pending manual console recovery/reliable SSH. PM2 health and admin eligibility were not confirmed. Antivirus installation remains on hold for Arush's decision; this VPS does not meet the updated local scanner memory guard.

SSH-access follow-up on 2 October: the user approved a separate maintenance key, which was appended to root's authorized keys after preserving a backup and the existing key. Strict-host-key, key-only authentication from the laptop succeeded as UID 0. PostgreSQL 15, Redis and Nginx were active. Reliable SSH access is now available; the earlier console issue no longer blocks remote operations. This did not install the scanner, activate operations timers, grant website admin access or publish pending application changes. Maintenance-key identity, backup, restrictions and revocation procedure are documented in `../README-VPS-HANDOVER.md`, section 9. The scanner capacity/approval requirement still applies.

Record scanner clean/EICAR results, actual large PDF/photo upload, admin login, received alerts, off-site backup key and successful isolated restore timestamp. These cannot be marked complete based on local unit tests or a prepared installer.

## Verified operations follow-up — 2 October 2026

The historical pending statements above describe earlier checkpoints. Operations tooling is now installed independently of the pending website release: root-owned modules at `/usr/local/libexec/anshkosh-operations/` and the fixed `anshkosh-ops` helper. Manual `install-operations.sh` and `configure-operations.mjs` were reviewed and run through authorized maintenance SSH; no scanner was installed. Existing env settings were privately backed up before adding alerts, a random encryption key and an explicit pre-rollout scanner hold. Do not rerun installers over existing files without comparison.

Actual encrypted R2 upload/read-back and an isolated PostgreSQL restore passed, including executions through the installed service restrictions. Daily backups, weekly restore tests and five-minute checks are enabled. Resource checks now include available RAM and sustained 15-minute load; local checks do not replace independent external uptime monitoring. Timers use the VPS's existing America/Denver timezone. Email test acceptance by Brevo was verified; inbox receipt is still pending confirmation.

The owner changed the admin target to `anshkosh@gmail.com`. Its existing verified, non-banned account was granted admin after a fresh verified off-site backup, with only its sessions revoked and password unchanged. No Rinu role grant was made. A protected Windows-account-bound encryption recovery copy is outside Git; a portable password-manager recovery copy is still recommended.

Local verification now totals 159 passing unit tests and a clean TypeScript check. Scanner-dependent website changes remain unpublished until approved/provisioned scanning passes real-engine tests. R2 direct-public access and a received alert remain unverified. External GitHub uptime automation is still local source, not confirmed activated on main.

At the user's separate explicit approval, a one-time disk cleanup removed 81 old log archives and four unused releases, preserving the active release, a health-checked immediate predecessor, original checkout and all backups. Disk use dropped from approximately 34.8 GiB to 17.1 GiB (`df -h`: 35G to 18G); production process PIDs/restart counts and public health/assets were unchanged. No recurring deletion job was enabled. See `../README-VPS-HANDOVER.md`, sections 10–11, for recovery material, exact retained/deleted targets, constraints and remaining work.
