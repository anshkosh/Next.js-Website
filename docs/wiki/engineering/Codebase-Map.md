# Codebase map

```
app/
  (public)/            Public, indexable pages: home, discover, categories, category/[slug],
                       startups/[slug], search, journal, launch-support/*, faq, contact,
                       privacy, terms, trust-safety
  (auth)/              login, register, forgot-password, reset-password, admin/login (noindex)
  (founder)/           dashboard, startup/new, startup/[id]/{edit,updates,discussion,launch-kit}
  (admin)/admin/       dashboard, moderation, startups, comments, categories, featured,
                       journal (+ categories, new, edit), settings, admins
  actions/             Server actions, one file per domain (startup, admin, upvote, comment, ...)
  api/                 auth/[...all], uploads/*, uploads/serve/[...path], og/[slug],
                       categories, cron/health
  proxy.ts             Request middleware: HTTPS redirect and route protection
  sitemap.ts, robots.ts
components/
  landing/             Home page sections and hero animation
  startup/             Profile, editor, uploads, discussion, Turnstile widget
  launch/              Launch Support toolkit UI
  site/                Pilot banner, entry curtain
  email/               React Email templates
  ui/                  shadcn/ui primitives
lib/
  auth.ts, auth-client.ts, auth-permissions.ts, auth-origins.ts
  db.ts                Prisma client
  seo.ts               Canonical URLs, metadata helper, JSON-LD
  jobs/                BullMQ connection, queues, worker logic
  email/               Brevo adapter
  storage/r2.ts        R2 client
  uploads/             Upload helpers (pdf-safety.ts)
  validators/          Zod schemas (startup, comment, contact, pitch deck, ...)
  faqs.ts, founder-toolkit.ts, launch-resources.ts   Content and toolkit data
workers/               PM2 entry points: email.ts, notification.ts, sync.ts
prisma/                schema.prisma, migrations/, seed.ts, search-vector trigger SQL
scripts/               set-admin-password.ts, verify-seo.mjs
deploy/                Deployment receiver, orchestrator, routing helper, systemd units,
                       nginx template (reference only), README
__tests__/             Vitest unit and integration tests
e2e/                   Playwright specs
.github/workflows/     deploy-vps.yml (tests on PRs; tests and deploy on main)
docs/wiki/             This wiki
```

## Conventions

- Path alias `@/` maps to the repository root.
- Validate input with Zod schemas in `lib/validators/`, on the server as well as the client.
- Use `seoMetadata()` for page metadata and `absoluteUrl()` for absolute links.
- Every new upload route must re-encode images with `sharp` or, for PDFs, run `sanitizePdf()`. See [Security](Security.md#uploads).
