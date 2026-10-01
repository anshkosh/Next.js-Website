# Automatic VPS deployment

Production is https://www.anshkosh.com, served by the VPS, not Vercel.

Push to `l3ad3r1/Anshkosh` **main** to publish. Local edits or pushes to other
branches do not publish. Pull requests run tests but cannot access deployment secrets.
The workflow can also be run manually from GitHub Actions, on main.

## Safety and server layout

- GitHub-hosted runners test the exact commit. Actions are pinned to commit SHAs.
- A dedicated SSH key may only run `check` or `deploy <SHA>`, without a shell,
  terminal, agent forwarding or port forwarding. The VPS host key is pinned.
- Secrets stay in `/var/www/anshkosh-shared/.env`, mode 600; they are not in Git.
- Each deployment gets a separate `/var/www/anshkosh-releases/<SHA>.<suffix>`.
- Root-owned deployment helpers are installed in `/usr/local/libexec`. Application
  code, dependency installation, builds, migrations and PM2 run as `deploy`, not root.
- The only passwordless privileged operation is the root-owned routing helper,
  which permits Anshkosh's proxy to select loopback port 3000 or 3012.
- The active site remains online during installation, tests and the production build.
- Database backups are validated before migration. Destructive/data-changing
  migrations are blocked for manual review. Only backwards-compatible schema
  additions belong in automatic deployments; backups are not an automatic undo.
- Health, commit identity, pages, SEO, 404s, built assets and worker stability are checked.
  Failures before publication keep the old site; post-switch failures restore it.
- Old releases, database backups and hashed static assets are retained. No automatic
  recursive cleanup is performed. Static assets are shared to support older browser tabs.
- PM2 saves the successful process list for reboot recovery. The active release and
  web port are recorded in `/var/www/anshkosh-shared/state/current.json`.

## GitHub configuration

Repository variables: `VPS_HOST`, `VPS_USER`, `VPS_DEPLOY_ENABLED=true`.
Repository secrets: `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.
Set `VPS_DEPLOY_ENABLED=false` to pause future deployments without stopping the site.
Failures are reported in GitHub Actions; they must be investigated, not force-published.

Root-owned helpers are deliberately not overwritten by uploaded application code.
Changes to the deployment helpers require a reviewed server installation.
Node is installed at `/home/deploy/.nvm/versions/node/v22.23.2/bin` on this VPS;
update the receiver path when upgrading that runtime.

## Manual recovery

Read the saved release/port from `state/current.json`; retain the previous release before
any maintenance. From the console, verify its web process and database health before
running `sudo /usr/local/sbin/anshkosh-route <3000-or-3012>`. Restore its workers from
`deploy.runtime.config.json` (or the initial release's `ecosystem.config.js`), then
save PM2. Do not automatically restore a database dump over current production data.

Dependency-install security advisories are not fixed by this deployment mechanism.
Dependency updates and potentially destructive migrations need separate review.
