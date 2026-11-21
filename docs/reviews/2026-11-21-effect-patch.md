# Effect dependency patch — 21 November 2026

Owner: Codex. Branch: `codex/effect-advisory-20261121`, from `569c05df`.
Status: implementation prepared; local checks complete with a build-environment
limitation, remote validation pending.
No merge or deployment.

## Problem and bounded change

Claude's independent review #1164 approved removal of the withdrawn picomatch
exception and identified a newer Effect advisory. Codex independently confirmed
the baseline audit has three high affected package entries, rooted in
[GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw).
The installed chain is Prisma 6.19.3 -> @prisma/config 6.19.3 -> Effect 3.21.0.
The advisory lists <=3.22.0 as affected and 3.22.1 as patched. The failing
schema compiles repeated string spans into a regex with expensive nonmatches.

Added a version-scoped npm override: `@prisma/config@6.19.3` -> Effect 3.22.1.
Prisma remains 6.19.3; no major downgrade, broad override or new audit exception
was introduced. Only Effect version/resolved/integrity changes in each of the
lockfile's two representations. npm's unrelated metadata rewrites were removed;
all other package metadata and versions are preserved. A final npm-ci dry run
accepts the narrowed lockfile. [npm override syntax](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides).

## Checks completed

- Fresh installation passed and generated Prisma Client 6.19.3.
- Current dependency gate: zero affected entries, zero accepted exceptions,
  zero policy failures.
- Prisma schema validation and direct config parsing pass using synthetic local
  configuration; no database connection or migration was performed.
- Six focused tests pass: five existing dependency-policy checks and the new
  bounded child-process TemplateLiteral regression. It accepts a valid value
  and rejects a 5,000-delimiter nonmatch within a five-second process budget.
- The same isolated expression against baseline Effect 3.21.0 is terminated
  at five seconds (ETIMEDOUT). The patched regression completes successfully.
- Lint and typecheck passed. Full Vitest suite: 913 passed, two skipped;
  122 test files passed and one was skipped. All 14 deployment-script tests
  passed against their local fixtures.
- The local production build compiled and completed TypeScript, then failed
  category page-data collection: its synthetic loopback database credentials
  were refused. This is not recorded as a passing build. No real credentials
  or existing database contents were used. The existing browser CI workflow
  provides disposable PostgreSQL 15/Redis and runs the full production build
  plus database invariants and browser journeys. That acceptance is pending.

Only the two Effect resolution records differ in the lockfile; no package paths
were added or removed, and other metadata is preserved. The fresh install and
final dry-run acceptance plus `npm ls` establish that Prisma/config remain
6.19.3 and use the overridden Effect 3.22.1. Node is 22.23.2; npm is 10.9.8.
The audit evaluator, workflow gates, schema, migrations and exception policy
are unchanged by this Effect diff. The cumulative branch includes previously
prepared parser and approved exception-removal changes from PR #108.

## Ownership and boundaries

The journal date-display correction remains next; this newly confirmed release
gate blocker takes precedence. Claude's prior approval of 569c05df is scoped
to that earlier diff, not this patch or a production release. The exact Effect
change will be sent for independent review after validation. Grok's overdue
synthetic concurrency result remains requested; no completion is inferred.
Oracle's unchanged queue-state reconciliation is recorded in #1170, with zero
new approvals, posts, skips or retries.

No website content, account, bot/ranking treatment, publisher, schedule,
production configuration or OpenKnowledge document/asset was changed.
