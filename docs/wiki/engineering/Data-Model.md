# Data model

Source of truth: `prisma/schema.prisma`. The database is PostgreSQL 15.

| Model | Purpose | Notes |
|---|---|---|
| `User` | Accounts (Better Auth) | `role` is `user`, `reviewer` or `admin`; `banned` is managed by the Better Auth admin plugin (the pitch-deck upload also refuses banned users) |
| `Session`, `Account`, `Verification` | Better Auth internals | Do not edit by hand |
| `Startup` | A startup listing | `status` (see below), `slug` unique, proposition fields (`problemStatement`, `solutionStatement`, `targetAudience`, `prototypeStatus`, `tractionEvidence`), `metadata` JSON (holds extras such as the pitch-deck URL), `searchVector` tsvector |
| `StartupFounder` | Co-founders shown on a profile | Ordered by `sortOrder` |
| `Category` | Industry categories | Names include an emoji; `slug` unique |
| `Upvote` | One per visitor per startup | Unique on `(startupId, fingerprintHash)` and `(startupId, cookieId)`; the visitor cookie is `anshkosh_vid` |
| `SlugRedirect` | Keeps old startup URLs working | |
| `FeaturedStartup` | Home-page featured list | |
| `StartupUpdate` | Founder progress posts | |
| `ContentModeration` | Durable AI checks and human review metadata | Content hash/lease/reasons; cascades on source deletion; see [moderation operations](../operations/Content-Moderation.md) |
| `ModerationBudget` | Shared daily request reservations | Hard maximum 100 AI requests per UTC day; Workers Free enforces the neuron limit |
| `Comment` | Public discussion | `PENDING` → `APPROVED`/`REJECTED`; `authorEmail` is private and never shown; `authorUserId` is set only when a verified session email matches; latest staff decision stores reviewer/time/note |
| `CommenterBlock` | Comment-only email restriction | HMAC of a verified commenter email, reason, staff actor, expiry and revocation; no duplicate raw email |
| `ModerationAccountBan` | Account-ban audit | Target, originating comment, staff actor, reason, expiry and revocation; uses Better Auth's existing `User.banned` fields |
| `JournalPost`, `JournalCategory` | Journal content | Quill Delta JSON plus rendered HTML; `DRAFT`/`PUBLISHED` |
| `NewsletterSubscriber` | Email signups | |
| `AppSetting` | Key/value site settings | Edited at `/admin/settings` |

## Startup status

`DRAFT` → `PENDING_REVIEW` → `LIVE` or `REJECTED`; a `LIVE` startup can become `SUSPENDED`. See [Startup lifecycle](../product/Startup-Lifecycle.md).

## Migrations

- Create migrations locally with `npx prisma migrate dev`. Commit the generated folder under `prisma/migrations/`.
- Production applies **additive, backwards-compatible** migrations automatically during deploy, after a validated backup. The pipeline blocks destructive or data-changing migrations (drops, renames, type changes) for manual review.
- Never run `prisma migrate reset`, `prisma db push` or hand-written destructive SQL against production.
- Because a failed deploy does **not** roll back migrations, the previous release must keep working with the new schema. Add columns as nullable or with defaults, and remove old ones in a later release.
