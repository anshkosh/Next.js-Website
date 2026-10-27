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
- `/leaderboard` is included in the sitemap and `public/llms.txt`. Its all-time signals combine net votes with capped points for public founder progress, approved community participation, and founder replies; they measure participation, not verified traction.
- Startups get dynamic Open Graph images from `app/api/og/[slug]`.
- `scripts/verify-seo.mjs` checks a built site's SEO, and the deploy pipeline checks SEO on each candidate release before switching traffic to it.

## Legacy campaign URLs

The 22 October 2026 Search Console alert listed three old `/campaigns/` URLs.
`/campaigns/cane-theory` permanently redirects (308, preserving query parameters)
to the verified public `/startups/cane-theory` profile. Keep this mapping explicit;
do not redirect every old campaign to a nonexistent startup or the homepage.

LoopLane and GlassWing Robotics are fictional demo profiles in the archived
legacy source (`src/data/enrolled-startups.js`, commit `4c1694a`). Neither has a
current public profile or sitemap entry, so their old campaign URLs remain genuine
404s. This change does not restore records or alter startup visibility/activity.
If an equivalent public page is introduced later, verify it before adding a mapping.

On 23 October, all 92 sitemap pages were checked for HTML links: none linked to
`/campaigns/`. Search Console's homepage referring-page entries are historical
discovery evidence, not proof of a current broken homepage link. After release,
verify the redirect and destination, then validate the repaired issue in Search
Console; intentionally absent pages do not need indexing requests.

## Journal

Journal detail pages avoid showing an excerpt twice when it already opens the
body, preserve numeric superscript citations, and expose full-size illustration
links for small screens. Share uses the browser's share sheet or a copy fallback.
The newsletter form was removed from the footer on 22 October 2026, so the
`#newsletter-signup` anchor no longer exists on public pages. Journal content that
links to it (the corrected Bluelearn CTA) needs a new destination. Reviewed
Bluelearn/category data corrections and their apply guards are documented in the
[site-swarm review](../operations/Site-Swarm-Bugfixes-2026-10-20.md).

Admins write journal posts at `/admin/journal` (rich text via Quill), grouped by `JournalCategory`. Topics so far: regional ecosystems (Hyderabad, Bengaluru, Delhi-NCR), government support for startups, founder playbooks, campaign notes and case studies of listed startups.

Articles with cover images use a white header panel with dark title, breadcrumb and byline text. The panel grows with wrapped titles and metadata, so readability does not depend on fitting everything inside the cover's fixed height. Articles without a cover keep their plain header.

Reading times use `lib/journal-reading-time.mjs`: visible article text at 200 words per minute, rounded up with a one-minute minimum. Journal cards, featured articles, detail pages, related articles and the admin table calculate from the current body. Create, edit and import operations use the same estimate. Existing articles do not need a database rewrite merely to correct their displayed reading time.

## Listings and backlinks

Discover paginates matching LIVE startups in batches of 24, filling complete rows
in both its two-column tablet and three-column desktop grids. Only the final page
may have an incomplete row. Search and category filters persist between pages.

Anshkosh is listed on Product Hunt, TechBaseDirectory and Crunchbase; the home page shows their badges. Directory submissions and backlink outreach are in progress. Keep what the site says ("planned") in line with what actually exists.

## Copy rules

- Follow the pilot rules in [Product overview](Overview.md): never imply payments, returns or guaranteed outcomes.
- Prefer measured, specific statements ("0 waitlist signups in 14 days") over adjectives ("strong demand").
- Publication review is not identity certification or independent verification of every claim. No automatic verification checkmark is shown on startup cards. FAQ and Trust & Safety explain the same limits; founder updates are not represented as independently verified milestone logs.
- Category names carry an emoji in the database (for example `FinTech 💳`). The Discover dropdown strips only the emoji, so punctuation such as `E-Commerce/D2C` is shown as written.

## Reviewed category correction

DroneHire fits the existing Aerospace & Drones category. `scripts/reclassify-dronehire.mjs` previews the change by default. Apply from the installed release environment only after a fresh verified backup, under the deployment lock, with `--apply --backup-state /var/www/anshkosh-shared/state/operations/backup.json --audit-dir /var/www/anshkosh-shared/state/content-audits`. The script changes only the published DroneHire category, stops on unexpected/concurrent edits, records private before/after evidence and is a no-op once corrected. No full seed, profile rewrite or vote change is needed.
