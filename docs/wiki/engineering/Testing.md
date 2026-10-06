# Testing

## Unit and integration tests (Vitest)

```bash
npm test
npx vitest run __tests__/pitch-deck-route.test.ts   # a single file
```

Tests live in `__tests__/`. Route-handler tests run in the Node environment (`// @vitest-environment node`) and mock `@/lib/auth` and `@/lib/storage/r2` with `vi.mock`; component tests use jsdom. Follow `__tests__/pitch-deck-route.test.ts` for the route pattern.

When you fix a bug, add a test that fails without the fix. When a test fails, fix the code or correct a wrong fixture. Do not loosen an assertion to get a pass.

## End-to-end tests (Playwright)

```bash
npx playwright test
```

Specs in `e2e/` cover public browsing, auth, the founder flow, the admin flow and later feature phases. They need a running app with a seeded database.

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
