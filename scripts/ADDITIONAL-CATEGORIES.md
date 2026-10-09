# Additional startup categories

The ten entries in `data/additional-categories.json` extend the catalogue beyond technology sectors. New installations receive them through the existing seed. Do not run the full seed against production to add these entries.

Validate with `node scripts/add-startup-categories.mjs --validate-only`. Run without flags from the installed release environment to preview missing entries. After a fresh verified backup, apply the reviewed script with:

```sh
node --env-file=/var/www/anshkosh-shared/.env scripts/add-startup-categories.mjs --apply --backup-state /var/www/anshkosh-shared/state/operations/backup.json --audit-dir /var/www/anshkosh-shared/state/content-audits
```

The script adds only missing slugs, preserves existing category IDs/names and startup assignments, and keeps Other last where present. Concurrent catalogue edits stop the transaction. A private audit stores before/after category records and the verified backup reference. Re-running after all additions is a no-op.
