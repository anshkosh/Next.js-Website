# Architecture

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, webpack builds), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Base UI |
| Database | PostgreSQL 15 via Prisma 6; full-text search with a `tsvector` column and trigger (`prisma/startup_search_vector_trigger.sql`) |
| Auth | Better Auth: email/password (verified email required) and Google OAuth, with the admin plugin for roles |
| Background jobs | BullMQ on Redis (`lib/jobs/`) |
| File storage | Cloudflare R2 through the S3 SDK (`lib/storage/r2.ts`), served through `/api/uploads/serve/...` |
| Email | React Email templates (`components/email/`) sent through Brevo (`lib/email/adapter.ts`) |
| Bot protection | Cloudflare Turnstile on contact and comment forms |
| Images | `sharp` re-encoding on upload; Next image optimisation |
| PDFs | `pdf-lib` checks and rewrites pitch decks |
| OG images | Next.js `next/og` (`app/api/og/[slug]`) |
| Logging | Winston to stdout/stderr, captured by PM2 (`lib/logger.ts`) |
| Tests | Vitest, Playwright |
| Hosting | A self-managed AlmaLinux VPS: nginx → PM2 → Next.js, with local PostgreSQL and Redis. Not Vercel. |

## Runtime processes (production)

```
Internet ──► nginx (TLS, www canonical, /_next/static from the shared static dir)
               │
               ▼ proxy_pass 127.0.0.1:3000 or :3012 (blue/green)
          anshkosh-web-<port>   (next start, PM2, user deploy)
               │            │
               ▼            ▼
          PostgreSQL 15   Redis ◄── worker-email         (BullMQ "email" queue → Brevo)
          (localhost)    (local)◄── worker-notification  ("notification" queue, e.g. new_submission)
                                ◄── worker-sync          ("sync" queue, upvote-count-sync)
               │
               ▼
          Cloudflare R2 (logos, galleries, photos, pitch decks; encrypted DB backups)
```

- The web process and the three workers all run from the same release directory. A deploy starts the new web process on the other port, switches nginx, then recreates the workers from the new release. See [Deployment pipeline](../operations/Deployment.md).
- Workers load `.env` before their imports (`node --env-file=.env --import=tsx`). Loading it after imports previously caused a retry loop and log growth, so keep this order.
- Health endpoint: `GET /api/cron/health` returns `{"status":"ok","db":"connected"}`.
- Release identity: `GET /.well-known/release.json` returns the deployed commit and build time.

## Request handling

- **Pages**: server components under `app/(public)`, `app/(founder)`, `app/(admin)` and `app/(auth)`. Public HTML is request-rendered for sessions, vote state and CSP nonces. Public signal aggregates are cached by PostgreSQL snapshot; see [Loading performance](Performance.md).
- **Mutations**: server actions in `app/actions/*.actions.ts`.
- **Uploads and auth**: route handlers under `app/api/`.
- **Access control**: layouts and server actions enforce identity and permissions. Root `proxy.ts` supplies the request CSP nonce and `no-store` HTML policy; see [Security](Security.md).

## Jobs

| Queue | Producer | Jobs |
|---|---|---|
| `email` | auth (verification, welcome), admin actions (approved, rejected), upvote milestones, notification worker | Templates in `components/email/`: welcome, new_submission, startup_approved, startup_rejected, upvote_milestone, contact_inquiry |
| `notification` | startup actions | `new_submission`: fans out to admin emails |
| `sync` | upvote actions | `upvote-count-sync`: reconciles `Startup.upvoteCount` |

The email queue retries 3 times with exponential backoff and keeps failed jobs for 7 days.

Startup submission, profile-revision and moderation delivery intents are stored
in NotificationOutbox within the same PostgreSQL transaction as the state change.
The immediate attempt is bounded; failure returns a saved result with
`notificationPending` rather than pretending the mutation failed. The sync worker
retries due intents every minute with a stable BullMQ job ID. This is durable
at-least-once delivery with queue deduplication, not a claim of provider-level
exactly-once email. Delivered intents are removed after seven days; failures remain
available for investigation/retry. Logs contain event IDs, not payloads.

The hourly request-retention job processes up to 500 expired beta contacts and
500 old closed records per run. Pending requests expire at 90 days; approved
contacts at 180 days after review (creation time for legacy undated approvals).
Expiry erases name/email/note and closes the request. Minimal closed consent
records are removed after a further year. The founder dashboard filters expiry
immediately, pages 20 requests at a time and provides an owner-scoped control to
clear pending requests older than 30 days. Newsletter confirmation tokens expire
after 24 hours; expired tokens and 180-day withdrawn/unconfirmed addresses are
cleaned by the same job. No account/startup records or server backups are purged.
