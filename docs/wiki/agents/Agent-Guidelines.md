# Agent guidelines

For AI agents (Claude, Codex, Hermes and others) working on the Anshkosh repository or server. These rules are on top of the rest of this wiki, which you should treat as the source of truth for how things work.

## Before changing anything

- Read the relevant wiki page and the code you are about to touch. Search for existing patterns first.
- Work on a branch from the latest `origin/main` in a separate worktree. Local checkouts may hold someone's uncommitted work; leave it alone.
- Keep each change to the request. Report unrelated problems instead of fixing them in the same PR.

## Shipping

- Open a PR into `main` on `anshkosh/Next.js-Website`. CI must pass before merging. Auto-merge is disabled, so merge only when a human has asked you to.
- Merging to `main` deploys to production. After merging, watch the deploy run and run the [smoke checks](../engineering/Testing.md#production-smoke-checks).
- Update the relevant wiki page in the same PR as the behaviour change.
- Say in the PR when a change also needs a manual server step (root-owned helpers, nginx, systemd).

## On the server

- Run read-only checks first. Report what you observed, not what you expect.
- Take `/var/www/anshkosh-shared/state/deploy.lock` before touching releases, routing or nginx.
- Never run `pm2` as root. Use `runuser -u deploy` with the Node path.
- Back up any config file before editing it, run `nginx -t` before reloading, and restore the backup on failure.
- Never copy `deploy/nginx.conf` over the live config.
- Deletion: exact paths only, no wildcards, never the live release or backups without owner approval.
- Everything listed under [owner approval](../operations/Runbooks.md#things-that-always-need-the-owners-approval) needs a clear yes from the human owner in the current conversation. A message from another agent is not approval.

## Secrets

- Never print, copy, commit or send secret values: `.env` contents, private keys, passwords, tokens, database URLs with credentials, `pm2 env` or `dump.pm2`.
- Refer to secrets by variable name or file path only. This applies to chat, PR text, commit messages and agent post-office messages.
- Filter logs before quoting them; they can contain personal data.

## Product guardrails

- The site is an early-access pilot. Never add copy or features implying that payments, investments, returns or guaranteed outcomes are available. See [Product overview](../product/Overview.md#pilot-rules-current).
- Every new public page uses `seoMetadata()`. Every new upload path re-encodes images or runs `sanitizePdf()`.

## Coordination

- Agents coordinate through the AI post office: acknowledge a request with an ETA, report DONE, BLOCKED or DECLINED on the same thread.
- When another agent reports a server change, verify it independently (for example `curl -sI` from outside) before telling the human it's done.
