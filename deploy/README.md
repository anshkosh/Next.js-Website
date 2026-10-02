# Automatic VPS deployment

Production is https://www.anshkosh.com, served by the VPS, not Vercel.

Push to `anshkosh/Next.js-Website` **main** to publish. Local edits or pushes to other
branches do not publish. Pull requests run tests but cannot access deployment secrets.
The workflow can also be run manually from GitHub Actions, on main.

## Shared workflow for Rinu and Arush

The shared repository is https://github.com/anshkosh/Next.js-Website.
Both contributors should clone this repository, pull the latest `main`, and work
on separate branches. Open a pull request targeting `main`; review the change and
its test results before merging. Each push or merge to `main` runs tests and then
publishes the exact tested commit to the VPS. Changes on `Anshkosh-Website/Rinu`
or another feature branch stay off production until merged into `main`.

`l3ad3r1/Anshkosh` is now a historical copy, not a production deployment source.
Its `VPS_DEPLOY_ENABLED` variable is disabled. The shared deployment workflow also
checks its repository identity to prevent copied workflows deploying by accident.
Do not enable deployment in both repositories. GitHub secrets and repository
settings are not copied by Git; configure these only in the shared repository.

The shared repository uses its own dedicated, restricted deployment SSH key.
It cannot open a server shell or forward connections. Never commit private keys
or the production environment file. The existing root-owned receiver, database,
Redis, Nginx and PM2 configuration stay in place; changing the GitHub source does
not migrate data or require Vercel.

For a new local checkout, run `git clone https://github.com/anshkosh/Next.js-Website.git`.
The existing Rinu checkout now uses this shared repository as `origin`; the
previous personal repository remains available as the `personal` remote.

The deployment key was created for this repository on 2026-10-02 and installed
with `restrict,command="/usr/local/libexec/anshkosh-receive"`. Its public-key
fingerprint is `SHA256:nLxQEeRGrQPcoEFvrvWuS6vURFpzzHlG1RaNMrsw/+E`.
The private key is stored in the shared repository's `VPS_SSH_KEY` Actions secret;
the VPS host keys are pinned in `VPS_KNOWN_HOSTS`. A successful `check` and a
rejected unrestricted command verify the credential's intended access boundary.
The old deployment variable is disabled; its credentials are retained for
explicit recovery, not for a second active deployment pipeline.

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
The optional profile photo editor and PDF pitch-deck upload use existing R2
storage and startup JSON metadata; no database migration or new key is needed.
PDFs are public on published profiles, limited to 5 MB, and served as downloads.
Nginx must allow multipart requests up to 6 MB. On this VPS, after checking the
active configuration, root can run `python3 deploy/set-upload-limit.py` from the
new release directory. This manually backs up and changes only
`/etc/nginx/conf.d/anshkosh.conf`, tests Nginx and reloads it, restoring the old
file on failure. The restricted deployment key cannot run this privileged step.
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
