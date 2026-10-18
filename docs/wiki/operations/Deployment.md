# Deployment pipeline

Production is https://www.anshkosh.com on a self-managed VPS. **Merging to `main` of `anshkosh/Next.js-Website` deploys.** Nothing else does. `deploy/README.md` has the full design notes.

## Flow

```
merge to main
  └─ GitHub Actions "Deploy website to VPS"
       ├─ test job: npm ci, Vitest, deploy unit tests
       └─ deploy job (main only, VPS_DEPLOY_ENABLED=true)
            └─ ssh deploy@VPS "deploy <sha>"  (restricted key: forced command, no shell)
                 └─ /usr/local/libexec/anshkosh-receive
                      ├─ takes /var/www/anshkosh-shared/state/deploy.lock
                      ├─ validates the archive (no links, no path traversal)
                      ├─ extracts to /var/www/anshkosh-releases/<sha>.<suffix>
                      └─ anshkosh-deploy.mjs (runs as deploy):
                           npm install, tests → migration screening → DB backup
                           → additive migrations → next build → start web on the idle port
                           → health, release identity, pages, SEO, assets checks
                           → copy static assets to the shared dir → switch nginx (anshkosh-route)
                           → recreate workers from the new release → public checks
                           → pm2 save, write state/current.json → stop the old web process
  └─ workflow verifies the public site serves the new commit
```

A typical deploy takes about 4 minutes. The site stays up throughout: the old web process keeps serving until the new one passes its checks.

## Blue/green ports

The web process alternates between `127.0.0.1:3000` and `127.0.0.1:3012`, named `anshkosh-web-3000` or `anshkosh-web-3012`. The live one is recorded in `/var/www/anshkosh-shared/state/current.json` (`commit`, `release`, `port`, `webName`, `updatedAt`). To confirm what is live, check all of:

1. `current.json`
2. `https://www.anshkosh.com/.well-known/release.json`
3. the PM2 process cwd
4. the `proxy_pass` port in `/etc/nginx/conf.d/anshkosh.conf`

## Failure behaviour

- A failure **before** the nginx switch leaves the old site untouched.
- A failure **after** the switch restores the old route and workers.
- Migrations are **not** undone. That is why migrations must be additive.
- Failed runs show in GitHub Actions. Investigate them; never force-publish.

## Controls

| Setting | Where | Effect |
|---|---|---|
| `VPS_DEPLOY_ENABLED` | Repo variable | `false` pauses deploys without stopping the site |
| `VPS_HOST`, `VPS_USER` | Repo variables | Target |
| `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS` | Repo secrets | Restricted deploy key and pinned host keys |

The workflow also checks it is running in `anshkosh/Next.js-Website`, so a copied repository cannot deploy by accident.

## What a merge does not change

These are root-owned on the server and change only through a deliberate install by someone with root:
- `/usr/local/libexec/anshkosh-receive`, `anshkosh-deploy.mjs`, `deployment-policy.mjs`, `anshkosh-validate-archive`
- `/usr/local/sbin/anshkosh-route` (nginx port switch) and its sudoers entry
- `/usr/local/libexec/anshkosh-ops`, `anshkosh-prune-releases` and the systemd units
- `/etc/nginx/conf.d/anshkosh.conf`

## Reviewed migration exceptions

The beta tester migration `20261018150000_beta_tester_signups` creates a new enum,
two tables with row-level security, indexes and foreign keys. The conservative
automatic scanner rejects enum creation and security changes even though this
migration only adds schema. `deploy/deployment-policy.mjs` permits this reviewed
migration only when both its name and its exact SHA-256 content hash match. Changed
SQL or another migration name still goes through the original screening rules.

Before deploying this release, install the reviewed policy file as root on the
VPS. Hold `state/deploy.lock`, back up the installed policy, verify the candidate
file against the reviewed Git commit, run Node's syntax check, then atomically
replace `/usr/local/libexec/deployment-policy.mjs` with root:root ownership and
mode 644. Verify it accepts the exact beta migration and rejects altered SQL.
Restore the backup if verification fails. Application uploads cannot perform
this privileged installation. After releasing the lock, merge the passing PR
or rerun the main deployment through GitHub Actions; the normal validated
database backup, migration and blue/green release steps still apply.

## Release retention

Each release is about 2 GB. `anshkosh-prune-releases.timer` runs daily at 03:30 server time (America/Denver) as `deploy`. It keeps the live release and the newest 3, deletes older ones, skips the run while a deploy holds the lock, and never deletes a directory a process is using. See [Runbooks](Runbooks.md#release-cleanup).
