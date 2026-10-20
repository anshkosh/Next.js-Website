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

Reliability regressions cover durable notification retries, saved-result reporting,
malformed/encoded pagination and bounded beta retention. The browser CI also runs
`scripts/test-startup-quotas-postgres.ts` against its disposable loopback database:
simultaneous creates cannot exceed either the default one-startup limit or a
configurable two-startup allowance. The script refuses production/remote databases.

The recheck adds real Better Auth endpoint tests in `auth-admin-permissions.test.ts`:
admins may manage users/sessions, reviewers retain content moderation but cannot
manage accounts, and ordinary/anonymous users are denied. These use an isolated
memory adapter and the actual production access-control role factory, not a mocked
permission comparison. No role type-casts hide missing runtime methods.

Team creation serializes on the parent startup row; every manual, one-day and
legacy feature-allocation path uses the same global advisory lock and six-slot
capacity check. Reordering is an atomic exact-list operation. Startup-update
create/delete and counter recount commit together, while cache refresh failures
cannot turn a committed save into an error response.
`scripts/test-recheck-invariants-postgres.ts` verifies concurrent team/feature
allocations and real insert/delete rollback on counter failure. It refuses any
database except loopback `anshkosh_e2e` and cleans only its own fixtures.
URL query overrides/fragments are rejected before connecting, and the startup and
featured tables must be empty before fixtures are created so the latest-startup
test cannot feature an unrelated listing. The URL guard has direct offline tests.
No test-startup labels, bot identities, scoring weights or existing activity are
changed by these repairs.

## End-to-end tests (Playwright)

Site-swarm regressions add native POST submission before hydration, signed-in
prefills and homepage gate bypass, and private pending-comment receipt isolation
across browsers. The CI widget is a captured API, with a fixture-only public key;
it makes no real Cloudflare challenge requests. Unit tests exercise receipt
forgery/expiry, early allowance checks, atomic limit races, saved-result reporting,
widget retry, and article presentation. `deploy/test_auth_log_redaction.py` tests
redaction using synthetic strings and temporary local files, never production logs.

```bash
npx playwright test
```

The active browser gate is `e2e/launch.spec.ts` (eight real end-to-end scenarios,
selected by `playwright.config.ts`). Other older spec files still contain planning
placeholders and are not claimed as coverage. The active suite uses a disposable
database and captured email/storage services; it must never point at production.
Photo-upload scenarios assert a successful upload response and a valid sanitized
storage URL before requiring the editor to close. The response wait uses the
existing 30-second browser action budget so cold dev compilation is distinct from
an actual server rejection; a failed upload is not accepted as a successful save.

The Playwright-managed development server disables source maps to reduce memory
use during browser checks; the normal development and production commands are
unchanged. CI prints line-by-line test progress and retains the HTML report
without opening a report server.

Before navigating after a mutation, wait for its persisted result. A voting button's optimistic `aria-pressed` state does not confirm that the server has saved the vote; leaving immediately can cancel the request and make cross-page signal checks race with the save.

## CI

`.github/workflows/deploy-vps.yml` runs on every pull request into `main` and every push to `main`:

1. `npm ci`
2. `npm run lint` (zero warnings, no application-rule suppression)
3. `npm run typecheck` (generates Next route/environment types first, including on clean CI checkouts)
4. `npm run audit:dependencies` (new/critical findings, changed exception versions,
   service errors and expired reviews block CI; known findings remain visible)
5. `npm test -- --maxWorkers=2`
6. `python3 -m unittest` for `deploy/test_upload_limit.py`

The browser job applies migrations to isolated PostgreSQL, checks signal scoring
and concurrent quotas, then runs all eight launch scenarios. Submission tests
verify the persisted pending-review status before navigation; cold compilation
does not replace the state assertion. Failed browser runs retain traces/screenshots
and the report for three days. Release builds also run TypeScript on the VPS.

The lint scope excludes generated builds, third-party installed design tooling and
local-only agent scratch/preview artifacts; tracked application source, workers,
scripts and tests are checked. The untracked admin sample is Git-ignored and must
never be deployed.

On pull requests the `deploy` job is skipped. On `main` it runs only after tests pass and only when `VPS_DEPLOY_ENABLED=true`. GitHub auto-merge is disabled for this repository, so merge manually after checks pass.

## Production smoke checks

After a deploy:

```bash
curl -s https://www.anshkosh.com/.well-known/release.json   # expected commit
curl -s https://www.anshkosh.com/api/cron/health            # status ok, db connected
curl -sI https://anshkosh.com/                              # 301 to www
```
