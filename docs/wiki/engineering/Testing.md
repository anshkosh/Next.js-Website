# Testing

## Unit and integration tests (Vitest)

```bash
npm test
npx vitest run __tests__/pitch-deck-route.test.ts   # a single file
```

Tests live in `__tests__/`. Route-handler tests run in the Node environment (`// @vitest-environment node`) and mock `@/lib/auth` and `@/lib/storage/r2` with `vi.mock`; component tests use jsdom. Follow `__tests__/pitch-deck-route.test.ts` for the route pattern.

When you fix a bug, add a test that fails without the fix. When a test fails, fix the code or correct a wrong fixture. Do not loosen an assertion to get a pass.

Founder mutations accept strict runtime profile schemas, never raw Prisma input.
`founder-actions.test.ts` attempts nested account-role escalation, relation changes
and scalar operators, and verifies rejection before any write. Profile `role`
means the displayed team title (for example CEO), not an account permission.
All founder mutations require a verified, non-banned owner; update/delete also
include ownership in the mutation predicate.

Security boundary regressions: `og-security.test.ts` denies arbitrary/internal
logo destinations and unpublished parents; `upload-entrypoints.test.ts` covers
all seven upload handlers, shared authorization/rate checks and image re-encoding;
`vote-action.test.ts` rotates user agents, cookies and forwarded addresses.
Anonymous votes use one identity per server-observed IP per startup and a shared
10-attempt/hour network budget. Shared networks can share that identity; this is
abuse resistance, not proof of one person. Production nginx must overwrite
`X-Real-IP` with `$remote_addr`, and Next must remain loopback-only. Rate limiter
increment/expiry is atomic and unavailable protection fails closed.

## End-to-end tests (Playwright)

```bash
npx playwright test
```

Specs in `e2e/` cover public browsing, auth, the founder flow, the admin flow and later feature phases. They need a running app with a seeded database.

The Playwright-managed development server disables source maps to reduce memory
use during browser checks; the normal development and production commands are
unchanged. CI prints line-by-line test progress and retains the HTML report
without opening a report server.

Before navigating after a mutation, wait for its persisted result. A voting button's optimistic `aria-pressed` state does not confirm that the server has saved the vote; leaving immediately can cancel the request and make cross-page signal checks race with the save.

## CI

`.github/workflows/deploy-vps.yml` runs on every pull request into `main` and every push to `main`:

1. `npm ci`
2. `npm test -- --maxWorkers=2`
3. `python3 -m unittest` for `deploy/test_upload_limit.py`

On pull requests the `deploy` job is skipped. On `main` it runs only after tests pass and only when `VPS_DEPLOY_ENABLED=true`. GitHub auto-merge is disabled for this repository, so merge manually after checks pass.

## Production smoke checks

After a deploy:

```bash
curl -s https://www.anshkosh.com/.well-known/release.json   # expected commit
curl -s https://www.anshkosh.com/api/cron/health            # status ok, db connected
curl -sI https://anshkosh.com/                              # 301 to www
```
