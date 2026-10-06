# Contributing and releases

## Repositories

| Remote | Role |
|---|---|
| `anshkosh/Next.js-Website` | **The shared production repository.** Merging to `main` deploys. |
| `l3ad3r1/Anshkosh` | Historical personal copy; deployment disabled. Pushing here does not deploy. |
| `arushroy/AnshkoshV2` | Arush's repository |

## Workflow

1. Pull the latest `main` and create a branch (`<name>/<topic>`, for example `claude/pdf-upload-safety` or `codex/footer-cleanup`).
2. Make the change with tests. Update the relevant wiki page in the same PR.
3. Open a pull request into `main`. CI runs the tests; nothing deploys from a PR.
4. Review the diff and the test result, then squash-merge. Auto-merge is disabled for this repository, so someone merges by hand after checks pass.
5. The merge to `main` deploys automatically. Watch the "Deploy website to VPS" run and check the [smoke checks](Testing.md#production-smoke-checks).

## Rules

- Keep each PR to one concern. Mention unrelated problems you notice instead of fixing them in the same PR.
- Database changes must be additive and backwards-compatible; see [Data model](Data-Model.md#migrations).
- Changes under `deploy/` that affect root-owned server helpers (`anshkosh-receive`, `anshkosh-deploy.mjs`, `anshkosh-route`, systemd units) do not take effect by merging. Someone must install them on the server. Say so in the PR.
- `deploy/nginx.conf` is a reference template only; the live config is edited on the server. See [Runbooks](../operations/Runbooks.md#edit-the-live-nginx-config).
- Rinu and Arush both work from the shared repository on separate branches.
