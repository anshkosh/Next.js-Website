# Loading performance

The public site keeps personalized HTML uncached. `proxy.ts` generates a fresh
CSP nonce, and sessions and vote flags are read at request time. Never apply a
blanket public HTML cache or store visitor-specific responses in Redis.

## Public data caching

`lib/public-signals.ts` caches only public aggregate signal rows in Redis for at
most 15 seconds. Each read obtains PostgreSQL's current MVCC snapshot inside the
existing read-only `RepeatableRead` transaction. The database/schema and snapshot
form the cache key. A newly visible commit uses a different key, including votes,
moderation, founder-mode changes, account erasure and worker publication. This
avoids relying on every writer remembering a cache-invalidation call.

Clock-driven changes also expire a cache. Its deadline is the earlier of the
15-second limit or the next feature expiry, approved update/comment/reply time,
or public approved founder-journal publication. Expired, future-dated and malformed
entries are rejected in the application as well as by Redis TTL. Increment the
cache namespace version when changing the signal query or public projection.

Call this helper only in transactions that perform no writes. Its snapshot key
does not describe a transaction's own uncommitted edits. The two application
callers are public read transactions in `lib/leaderboard.ts`; they must retain
`RepeatableRead` so counts, ranks and selected profiles share one database view.

Redis failures fall back to PostgreSQL. The optional cache has a separate
connection, 200 ms connection/command timeouts and a five-second retry cooldown;
queue and rate-limit behavior is unchanged. Public aggregate rows contain no
emails, sessions or vote-record identifiers. Vote flags are selected separately
for the current visitor in the same leaderboard transaction.

Discover's grid and featured content share a request-scoped activity read.
The homepage loads five profile projections instead of fetching twenty and
discarding fifteen. Profile metadata and page rendering share a request-scoped
profile read. These request caches use React `cache()` and never share cookies
across visitors.

`GET /api/categories` returns public reference labels only and permits 60 seconds
of browser/shared caching. Errors are `no-store`. Do not add startup visibility
counts, account details or viewer state to this response without revisiting that
policy. Browser category labels can lag an admin edit by up to one minute.

## Rendering and payloads

- Homepage rankings stream behind a skeleton while the static hero can render.
- Discover, search, categories, journal and leaderboard have skeleton fallbacks.
  They expose one loading status and respect reduced-motion preferences.
- The hero is fetched eagerly with high priority and WebP quality 75. Other
  below-fold images keep their existing lazy loading.
- Kosh's sprite/animation library loads on demand for an error or empty state;
  its wrapper reserves the existing character dimensions.
- Startup updates are selected three at a time with deterministic date/ID
  ordering. The server-rendered timeline links to newer/older pages and keeps
  the full approved-update count and existing journal-page parameter. Unpublished
  updates remain excluded. No score weights or activity eligibility changed.
- The unused `@types/uuid` stub was removed; uuid supplies its own types.

## Verification and measurement

Unit tests cover snapshot reuse/rejection, scheduled expiry, Redis failure,
visitor projections, page limits, update numbering and API error-cache policy.
The browser CI runs `scripts/test-public-signals-cache-postgres.ts` against only
the disposable loopback `anshkosh_e2e` database. It verifies real MVCC behavior,
including a concurrent uncommitted founder-mode change, committed visibility/vote
changes and scheduled eligibility. It creates and removes only its own fixtures.

The `Public loading performance` workflow runs Lighthouse 13.5.0 sequentially on
home, Discover and leaderboard after a successful main deployment workflow, or
on manual dispatch. HTML/JSON reports are retained for 14 days. It measures the
actual currently public release; another deployment can supersede the workflow's
triggering commit. The homepage audit includes its first-visit curtain. These
single lab measurements are observations, not release correctness gates or
real-user percentiles. The code and isolated browser/DB release gates remain
required.

## HTTP/2 and infrastructure

The 26 October audit observed HTTP/1.1 in both browser requests and a direct
public TLS ALPN negotiation, despite the reference nginx template mentioning
HTTP/2. Do not replace the installed config with that outdated template.

`deploy/enable-http2.py` is a prepared manual change for the existing AlmaLinux
nginx setup. It checks module support and the official host/routing structure,
takes the deployment lock, backs up the current file, changes only existing TLS
listen options, validates, and reloads. It restores the backup if validation or
reload fails. Run it only through authorized operator access to the active
release; it is deliberately not installed or invoked by application deployment.
It uses the `listen ... ssl http2` syntax compatible with the recorded nginx
1.14.1; nginx 1.25.1+ also has the newer `http2 on` directive. If the script finds
HTTP/2 already configured, inspect ALPN/runtime configuration rather than making
unrelated TLS changes. Verify from outside with a client offering `h2`, then
check health, release identity and pages.

The audit's maintenance SSH login was rejected. HTTP/2 is not claimed enabled,
and no live server config, database pool limit or DNS was changed by preparing
these fixes. A front-site CDN requires separate DNS/account configuration;
cache personalized HTML only after an explicit security-aware design. A load
balancer or separate database pooler is not required by these code changes.
Prisma's existing pool, compression and immutable static/image caches remain.
