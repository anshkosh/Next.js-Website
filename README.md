# Anshkosh

**A public validation platform for Indian startups.** Founders publish evidence, risks and structured public signals before launch; backers discover startups and follow the teams turning early demand into measurable traction.

Live at **https://www.anshkosh.com**, currently an **early-access pilot**: visitors can give feedback, join waitlists and express interest, but no payments, pledges, orders or investments are open.

## Documentation

The project wiki is in [`docs/wiki/`](docs/wiki/Home.md). Start there.

| Topic | Page |
|---|---|
| What Anshkosh is and the pilot rules | [Product overview](docs/wiki/product/Overview.md) |
| How it's built | [Architecture](docs/wiki/engineering/Architecture.md), [Codebase map](docs/wiki/engineering/Codebase-Map.md), [Data model](docs/wiki/engineering/Data-Model.md) |
| Running it locally | [Local development](docs/wiki/engineering/Local-Development.md) |
| Tests and CI | [Testing](docs/wiki/engineering/Testing.md) |
| Making a change | [Contributing and releases](docs/wiki/engineering/Contributing.md) |
| How it deploys | [Deployment pipeline](docs/wiki/operations/Deployment.md) |
| Running production | [VPS operations](docs/wiki/operations/VPS-Operations.md), [Runbooks](docs/wiki/operations/Runbooks.md), [Backups](docs/wiki/operations/Backups-and-Restore.md) |
| Security | [Security](docs/wiki/engineering/Security.md) |
| AI agents working on this repo | [Agent guidelines](docs/wiki/agents/Agent-Guidelines.md) |

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 + shadcn/ui · PostgreSQL 15 + Prisma · Better Auth (email/password + Google) · BullMQ + Redis · Cloudflare R2 · React Email + Brevo · Cloudflare Turnstile · Vitest + Playwright.

Hosted on a self-managed VPS (nginx → PM2, blue/green on ports 3000/3012) with local PostgreSQL and Redis. Not Vercel.

## Quick start

Requires Node.js 22, PostgreSQL 15 and Redis 7 (or Docker Compose for the last two).

```bash
git clone https://github.com/anshkosh/Next.js-Website.git anshkosh
cd anshkosh
npm install
cp compose.env.example compose.env      # set POSTGRES_PASSWORD, then:
docker compose --env-file compose.env up -d
# create .env (see the wiki for the variable list), then:
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev                              # http://localhost:3000
```

Full instructions, environment variables and worker commands: [Local development](docs/wiki/engineering/Local-Development.md).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit and integration tests |
| `npx playwright test` | End-to-end tests |

## Deploying

**Merging to `main` of `anshkosh/Next.js-Website` deploys to production.** GitHub Actions runs the tests, then sends the exact commit to the VPS over a restricted SSH key. The server builds it into a new release, checks it on the idle port, switches nginx and recreates the workers, with no downtime. Pull requests run tests only.

Open a PR into `main`, wait for the checks, and squash-merge (auto-merge is disabled). Details, failure behaviour and rollback: [Deployment pipeline](docs/wiki/operations/Deployment.md) and [Runbooks](docs/wiki/operations/Runbooks.md).

`deploy/deploy.sh` is retired and refuses to publish. Never deploy by hand or in place.

## Repository layout

```
app/          Routes: (public), (auth), (founder), (admin), actions/, api/
components/   UI, landing page, startup profile, Launch Support toolkit, email templates
lib/          Auth, DB, SEO, jobs, storage, uploads, validators
workers/      BullMQ workers (email, notification, sync)
prisma/       Schema, migrations, seed
deploy/       VPS receiver, orchestrator, routing helper, systemd units
docs/wiki/    Project wiki
__tests__/    Vitest     e2e/   Playwright
```
