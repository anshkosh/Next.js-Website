# Backups and restore

## What is backed up

The PostgreSQL database `anshkosh`. Uploads live in Cloudflare R2 and are not part of these backups. Code is in Git, and releases can be rebuilt from any commit.

## Daily encrypted backup

`anshkosh-backup.timer` runs `anshkosh-ops backup` as `deploy` every day at 02:30 Denver time. It:

1. Takes a custom-format `pg_dump` and checks the archive listing.
2. Encrypts the dump with AES-256-GCM, using `BACKUP_ENCRYPTION_KEY` from the shared `.env`.
3. Uploads it to R2 bucket `anshkosh` under `private-backups/`.
4. Downloads it again, checks the SHA-256 and that it decrypts, then records success in `state/operations/backup.json`.

Local copies are kept in `/var/www/anshkosh-shared/backups/operations/`. Nothing purges old dumps automatically. Each deploy also takes a local dump before running migrations.

Limits: the encrypted upload is capped at 256 MiB per dump. Nobody has independently checked that the R2 bucket is private; encryption protects the contents either way.

## Weekly restore test

`anshkosh-restore-test.timer` runs every Sunday at 04:00 Denver time, as `deploy`. It decrypts the latest off-site backup into a **separate, temporary** PostgreSQL instance (private socket, no TCP), queries the application tables, then deletes the instance. It never touches production. The result is in `state/operations/restore.json`.

Run either job on demand:

```bash
runuser -u deploy -- /usr/local/libexec/anshkosh-ops backup
runuser -u deploy -- /usr/local/libexec/anshkosh-ops restore-test
```

## Restoring production

There is **no one-command production restore, on purpose.** Restoring overwrites live data, so it is a decision for the owner:

1. Stop and decide with the owner which backup and how much data loss is acceptable.
2. Pause deploys (`VPS_DEPLOY_ENABLED=false`).
3. Take a fresh dump of the current database and keep it.
4. Decrypt and validate the chosen backup privately, and rehearse the restore in isolation first.
5. Check the schema still matches the running release.
6. Agree the downtime and the exact write procedure with the owner, then restore.
7. Verify health, then re-enable deploys.

Never restore a dump over production automatically or as a first troubleshooting step.

## Encryption key recovery

`BACKUP_ENCRYPTION_KEY` lives in the shared `.env`. The only off-server copy is a Windows DPAPI-protected file on the operator's PC, readable only by that Windows user on that machine. If both the server and that PC are lost, the backups cannot be decrypted. Making a separately protected portable copy is an open action.
