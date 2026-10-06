# Content, SEO and growth

## Canonical host

`https://www.anshkosh.com` is canonical. `lib/seo.ts` rewrites every first-party absolute URL to `www`. The live nginx config redirects `anshkosh.com` and plain HTTP to `https://www.anshkosh.com` with a 301 (since 6 October 2026).

Use `seoMetadata()` from `lib/seo.ts` on every new public page so it gets a title, description, canonical URL, Open Graph and Twitter tags.

## Indexing

- `app/sitemap.ts` lists public pages, live startups, categories and journal posts.
- `app/robots.ts` disallows `/admin/`, `/dashboard/`, `/startup/` (the founder editor), `/api/`, the auth pages and `/search`.
- The auth pages also set `robots: noindex` in `app/(auth)/layout.tsx`.
- Organization and WebSite JSON-LD come from `lib/seo.ts`.
- Startups get dynamic Open Graph images from `app/api/og/[slug]`.
- `scripts/verify-seo.mjs` checks a built site's SEO, and the deploy pipeline checks SEO on each candidate release before switching traffic to it.

## Journal

Admins write journal posts at `/admin/journal` (rich text via Quill), grouped by `JournalCategory`. Topics so far: regional ecosystems (Hyderabad, Bengaluru, Delhi-NCR), government support for startups, founder playbooks, campaign notes and case studies of listed startups.

## Listings and backlinks

Anshkosh is listed on Product Hunt, TechBaseDirectory and Crunchbase; the home page shows their badges. Directory submissions and backlink outreach are in progress. Keep what the site says ("planned") in line with what actually exists.

## Copy rules

- Follow the pilot rules in [Product overview](Overview.md): never imply payments, returns or guaranteed outcomes.
- Prefer measured, specific statements ("0 waitlist signups in 14 days") over adjectives ("strong demand").
- Category names carry an emoji in the database (for example `FinTech 💳`). The Discover dropdown strips only the emoji, so punctuation such as `E-Commerce/D2C` is shown as written.
