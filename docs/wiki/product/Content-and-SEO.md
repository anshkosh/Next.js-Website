# Content, SEO and growth

## Canonical host

`https://www.anshkosh.com` is canonical. `lib/seo.ts` rewrites every first-party absolute URL to `www`. The live nginx config redirects `anshkosh.com` and plain HTTP to `https://www.anshkosh.com` with a 301 (since 6 October 2026).

Use `seoMetadata()` from `lib/seo.ts` on every new public page so it gets a title, description, canonical URL, Open Graph and Twitter tags.

## Indexing

- `app/sitemap.ts` lists public pages, live startups, categories and journal posts.
- `app/robots.ts` disallows `/admin/`, `/dashboard/`, `/startup/` (the founder editor), `/api/`, the auth pages and `/search`.
- The auth pages also set `robots: noindex` in `app/(auth)/layout.tsx`.
- Organization and WebSite JSON-LD come from `lib/seo.ts`.
- Startup JSON-LD describes the business as an `Organization`, with `Person` founders from its published team records. It does not expose the account owner's private identity or treat every business as software.
- Shared product descriptions cover discovery, founder progress, feedback and free tools. Search has its own canonical/social metadata while remaining excluded from indexing.
- `/leaderboard` is included in the sitemap and `public/llms.txt`, with signals defined as all-time upvotes minus downvotes.
- Startups get dynamic Open Graph images from `app/api/og/[slug]`.
- `scripts/verify-seo.mjs` checks a built site's SEO, and the deploy pipeline checks SEO on each candidate release before switching traffic to it.

## Journal

Admins write journal posts at `/admin/journal` (rich text via Quill), grouped by `JournalCategory`. Topics so far: regional ecosystems (Hyderabad, Bengaluru, Delhi-NCR), government support for startups, founder playbooks, campaign notes and case studies of listed startups.

Reading times use `lib/journal-reading-time.mjs`: visible article text at 200 words per minute, rounded up with a one-minute minimum. Journal cards, featured articles, detail pages, related articles and the admin table calculate from the current body. Create, edit and import operations use the same estimate. Existing articles do not need a database rewrite merely to correct their displayed reading time.

## Listings and backlinks

Anshkosh is listed on Product Hunt, TechBaseDirectory and Crunchbase; the home page shows their badges. Directory submissions and backlink outreach are in progress. Keep what the site says ("planned") in line with what actually exists.

## Copy rules

- Follow the pilot rules in [Product overview](Overview.md): never imply payments, returns or guaranteed outcomes.
- Prefer measured, specific statements ("0 waitlist signups in 14 days") over adjectives ("strong demand").
- Publication review is not identity certification or independent verification of every claim. No automatic verification checkmark is shown on startup cards. FAQ and Trust & Safety explain the same limits; founder updates are not represented as independently verified milestone logs.
- Category names carry an emoji in the database (for example `FinTech 💳`). The Discover dropdown strips only the emoji, so punctuation such as `E-Commerce/D2C` is shown as written.

## Reviewed category correction

DroneHire fits the existing Aerospace & Drones category. `scripts/reclassify-dronehire.mjs` previews the change by default. Apply from the installed release environment only after a fresh verified backup, under the deployment lock, with `--apply --backup-state /var/www/anshkosh-shared/state/operations/backup.json --audit-dir /var/www/anshkosh-shared/state/content-audits`. The script changes only the published DroneHire category, stops on unexpected/concurrent edits, records private before/after evidence and is a no-op once corrected. No full seed, profile rewrite or vote change is needed.
