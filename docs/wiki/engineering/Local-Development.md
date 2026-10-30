# Local development

## Prerequisites

- Node.js 22 (production runs 22.23.2)
- PostgreSQL 15 and Redis 7, or Docker with Compose to run them
- npm

## Setup

```bash
git clone https://github.com/anshkosh/Next.js-Website.git anshkosh
cd anshkosh
npm install            # postinstall runs prisma generate
```

Start PostgreSQL and Redis with Docker, if you don't already run them:

```bash
cp compose.env.example compose.env   # set POSTGRES_PASSWORD
docker compose --env-file compose.env up -d
```

Create `.env` (never commit it) and set the variables below, then:

```bash
npx prisma migrate dev
npx tsx prisma/seed.ts                           # categories and sample data
npx tsx prisma/seed.ts --create-admin <email>    # make an existing user an admin
npm run dev                                      # http://localhost:3000
```

Run the workers in separate terminals when you work on email, notifications or upvote sync:

```bash
node --env-file=.env --import=tsx workers/email.ts
node --env-file=.env --import=tsx workers/notification.ts
node --env-file=.env --import=tsx workers/sync.ts
```

## Environment variables

Names only. Production values live in `/var/www/anshkosh-shared/.env` on the VPS and are never committed or pasted into chats or agent messages.

| Variable | Used for |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Auth sessions and callback base URL |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | BullMQ queues and rate limits |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Upload storage |
| `BREVO_API_KEY`, `EMAIL_FROM` | Outgoing email |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Bot protection on forms |
| `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL` | Absolute URLs; production values normalise to `https://www.anshkosh.com` |
| `LOG_LEVEL` | Winston log level |

Without `DATABASE_URL`, some public pages (for example `/categories`) render a placeholder instead of failing.

## Useful scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server (webpack) |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npx playwright test` | End-to-end tests |
| `npx tsx scripts/set-admin-password.ts --email <admin-email>` | Break-glass admin password reset; prompts privately and records an audit entry |
| `node scripts/verify-seo.mjs` | SEO checks against a running site |

The operator reset is a fallback for an existing, verified, active admin account.
Run it interactively, enter the operator name, reason and owner-approval
reference, confirm the target email, then enter the new password twice at the
hidden prompts. It uses Better Auth's password hasher, revokes all target
sessions, invalidates pending email reset links and writes a database audit
record. The password is never accepted as a command-line argument or printed.

## Windows notes

- The repository is developed on Windows as well as Linux. Git may report `LF will be replaced by CRLF` warnings; files are stored with LF.
- Shell scripts under `deploy/` must keep LF endings and their executable bit (`git update-index --chmod=+x`).
