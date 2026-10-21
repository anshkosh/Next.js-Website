# Anshkosh wiki

Anshkosh (www.anshkosh.com) is a public validation platform for Indian startups, in an early-access pilot. Founders publish evidence, risks and structured public signals before launch; backers discover startups and follow their progress. No payments, pledges or orders are open during the pilot.

This wiki lives in the repository so it is reviewed with the code it describes. Edit it in a pull request like any other change, and update the relevant page in the same PR when you change the behaviour it documents.

## Start here

| If you are… | Read |
|---|---|
| New to the project | [Product overview](product/Overview.md), then [Architecture](engineering/Architecture.md) |
| Writing code | [Local development](engineering/Local-Development.md), [Codebase map](engineering/Codebase-Map.md), [Testing](engineering/Testing.md) |
| Shipping a change | [Contributing and releases](engineering/Contributing.md), [Deployment pipeline](operations/Deployment.md) |
| Operating production | [VPS operations](operations/VPS-Operations.md), [Backups and restore](operations/Backups-and-Restore.md), [Runbooks](operations/Runbooks.md) |
| Reviewing security | [Security](engineering/Security.md) |
| Writing copy or working on SEO | [Content, SEO and growth](product/Content-and-SEO.md) |
| An AI agent (Claude, Codex, Hermes) | [Agent guidelines](agents/Agent-Guidelines.md) |

## All pages

**Product**
- [Overview](product/Overview.md): what Anshkosh is, pilot rules, users and roles
- [Accounts and founder mode](product/Accounts-and-Founder-Mode.md): registration, settings, workspace preferences and draft recovery
- [Startup lifecycle](product/Startup-Lifecycle.md): application, moderation, live listing, updates
- [Content, SEO and growth](product/Content-and-SEO.md): canonical host, sitemap, journal, listings, copy rules

**Engineering**
- [Architecture](engineering/Architecture.md): stack, runtime processes, data flow
- [Codebase map](engineering/Codebase-Map.md): where things live
- [Data model](engineering/Data-Model.md): Prisma models and statuses
- [Leaderboard signals](engineering/Leaderboard-Signals.md): scoring, eligible activity, privacy, shared ranks
- [Local development](engineering/Local-Development.md): setup and environment variables
- [Testing](engineering/Testing.md): Vitest, Playwright, CI
- [Security](engineering/Security.md): auth, roles, uploads, origins
- [Contributing and releases](engineering/Contributing.md): branches, PRs, merging

**Operations**
- [Deployment pipeline](operations/Deployment.md): `main` → GitHub Actions → VPS
- [VPS operations](operations/VPS-Operations.md): access, layout, services, health checks
- [Backups and restore](operations/Backups-and-Restore.md)
- [Runbooks](operations/Runbooks.md): rollback, incidents, nginx edits, release cleanup

**Agents**
- [Agent guidelines](agents/Agent-Guidelines.md): guardrails for AI agents on the repo and server

## Known gaps

- `logs/error.log` and `logs/combined.log` are tracked in Git. Logs should not be committed.
