# Pilot content correction

The 9 October 2026 correction changes Cane Theory's reviewed build-stage value
from a software beta to `Preparing a pilot` and updates eight recovered Journal
articles to use preorders and the current pilot positioning. Existing article
URLs remain stable. HTML, editor content, excerpts and SEO titles/descriptions
are corrected together; categories, cover images, publication dates, authors,
comments, vote totals and other startups are not edited.

`update-pilot-content.mjs` defaults to a read-only preview. It requires all eight
published articles and the live Cane Theory profile. It stops if an article does
not match the reviewed baseline hash or the corrected content, or if the startup
has a different stage. A completed update is safe to preview or run again.

Validate without a database:

```text
node scripts/update-pilot-content.mjs --validate-only
node scripts/import-legacy-journal.mjs --validate-only
```

From a configured application release, preview with the existing runtime and
environment. Before applying, run the installed, verified backup operation.
Apply with the fresh backup record and a private audit directory:

```text
node --env-file=/var/www/anshkosh-shared/.env scripts/update-pilot-content.mjs
node --env-file=/var/www/anshkosh-shared/.env scripts/update-pilot-content.mjs --apply --backup-state /var/www/anshkosh-shared/state/operations/backup.json --audit-dir /var/www/anshkosh-shared/state/content-audits
```

The backup record must be less than 15 minutes old and refer to an existing,
nonempty dump with a recorded verified hash. Before-values and the backup
reference are retained in the audit file before writing. All changes happen in
one serializable transaction with concurrent-edit checks. Do not turn this
script into an automatic data migration or run a full legacy import over
existing content. The ordinary GitHub release publishes the page/component copy.
