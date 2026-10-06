# anshkosh

> **Docs:** the project wiki is in [`docs/wiki/Home.md`](docs/wiki/Home.md). It covers the product, architecture, the VPS deployment pipeline, operations runbooks and agent guidelines, and is authoritative where this README is out of date.

**India's Startup Showcase Platform** — a ProductHunt-style discovery platform built for the Indian market. Founders submit startups for public discovery; visitors browse, search by category, and upvote listings; an admin team moderates submissions for quality control.

---

## Tech Stack

| Layer | Choice |
|:---|:---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | Better Auth (Google OAuth + Email/Password) |
| **File Storage** | Cloudflare R2 (S3-compatible) |
| **Email** | React Email + Brevo |
| **Background Jobs** | BullMQ + Redis |
| **Search** | PostgreSQL FTS (`tsvector`) |
| **OG Images** | `@vercel/og` / satori |
| **Logging** | Winston |
| **Testing** | Vitest + Playwright |
| **Hosting** | Self-hosted VPS (Hetzner) — PM2 + Nginx |

---

## Project Structure

```
anshkosh/
├── app/
│   ├── (public)/          # SEO routes — no auth required
│   ├── (auth)/            # Login / signup pages
│   ├── (founder)/         # Founder dashboard
│   ├── (admin)/           # Admin moderation panel
│   ├── actions/           # Server Actions
│   └── api/               # Route Handlers
├── components/            # Shared UI components
├── lib/                   # Utilities, auth, db, email, storage
├── workers/               # BullMQ background workers
│   ├── email.ts
│   ├── notification.ts
│   └── sync.ts
├── prisma/                # Schema + migrations + seed
├── deploy/                # Deployment scripts & Nginx config
├── docs/                  # Technical spec & phase prompts
├── __tests__/             # Vitest unit/integration tests
└── e2e/                   # Playwright E2E tests
```

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm
- Docker with Compose (optional, for local PostgreSQL and Redis)

---

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd anshkosh
npm install
```

### 2. Configure environment variables

Create a local `.env` file and set your values:

| Variable | Description |
|:---|:---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret for auth sessions |
| `BETTER_AUTH_URL` | App base URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis connection |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Cloudflare R2 storage |
| `BREVO_API_KEY` / `EMAIL_FROM` | Brevo email sender |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile CAPTCHA |

### 3. Start local PostgreSQL and Redis (optional)

If you do not already have these services, run them in Docker:

```bash
cp compose.env.example compose.env
# Set POSTGRES_PASSWORD in compose.env before continuing.
docker compose --env-file compose.env up -d
docker compose --env-file compose.env ps
```

The containers use persistent Docker volumes and expose PostgreSQL and Redis only on localhost. In `.env`, point the app at these services (substitute the password you set in `compose.env`; URL-encode any special characters in it):

```dotenv
DATABASE_URL="postgresql://anshkosh:<your-password>@localhost:5432/anshkosh?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

If either host port is occupied, change `POSTGRES_PORT` or `REDIS_PORT` in `compose.env` and use the same port in the app's `.env`. Run `docker compose --env-file compose.env down` to stop the services; the volumes remain intact. This Compose file is for local development, not the VPS production deployment.

### 4. Set up the database

```bash
npx prisma migrate dev
npx tsx prisma/seed.ts
```

To seed an admin user:

```bash
npx tsx prisma/seed.ts --create-admin <user_email>
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Scripts

| Command | Description |
|:---|:---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests |

---

## Testing

### Unit & integration tests (Vitest)

```bash
npm run test
```

### E2E tests (Playwright)

```bash
npx playwright test
```

---

## Deployment (VPS)

The app is self-hosted on a Hetzner VPS using PM2, PostgreSQL, Redis, and Nginx.

### PM2 processes (`ecosystem.config.js`)

| Process | Description |
|:---|:---|
| `anshkosh-web` | Next.js app server (port 3000) |
| `worker-email` | BullMQ email job worker |
| `worker-notification` | BullMQ notification worker |
| `worker-sync` | BullMQ sync worker |

### Deploy

```bash
bash deploy/deploy.sh
```

This pulls the latest `main` branch, installs dependencies, runs Prisma migrations, builds the Next.js app, and reloads PM2 processes.

### Manual PM2 commands

```bash
pm2 status                        # View all processes
pm2 logs anshkosh-web             # Stream app logs
pm2 reload ecosystem.config.js   # Zero-downtime reload
pm2 save                          # Persist process list
```

---

## MVP Features

- ✅ Startup listings (max 3 per founder)
- ✅ Admin moderation (approve / reject)
- ✅ Anonymous upvoting
- ✅ Category browsing + PostgreSQL full-text search
- ✅ Email notifications (6 types via Brevo)
- ✅ SEO-first: SSR/ISR, dynamic OG images, JSON-LD, sitemap, robots.txt
- ✅ Google OAuth + email/password auth (Better Auth)
- ✅ Cloudflare Turnstile CAPTCHA

### Deferred to v2

- Verified badge / paid tier
- Payment integration (Razorpay / Cashfree)
- Video, pitch deck, metrics fields
- Dark mode
- Meilisearch (fuzzy search)
- Comments on listings
