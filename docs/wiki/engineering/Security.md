# Security

## Authentication

- Better Auth (`lib/auth.ts`) with email/password and Google OAuth. Email verification is required before a founder can act; verification mail goes through the email queue.
- Trusted origins for auth and uploads come from `lib/auth-origins.ts`: `https://www.anshkosh.com` and `https://anshkosh.com` in production. Upload routes reject requests whose `Origin` is not trusted (CSRF protection).

## Roles and permissions

Defined with the Better Auth admin plugin in `lib/auth.ts` and `lib/auth-permissions.ts`:

| Role | Startups | Categories | Settings | Admins |
|---|---|---|---|---|
| `user` | create, read, update (own) | read | none | none |
| `reviewer` | read, moderate | read, create, update | none | none |
| `admin` | all, including delete and moderate | all | read, update | create, read, delete |

`app/proxy.ts` blocks `/admin/*` for anyone who isn't an admin or reviewer, and limits `/admin/settings` and `/admin/admins` to admins. Server actions check permissions again. Never rely on the proxy alone.

Grant an admin role only with the owner's explicit approval.

## Uploads

| Rule | Where |
|---|---|
| Images (logo, gallery, founder photo, update images) are decoded and re-encoded with `sharp`, which drops non-pixel payloads | `app/api/uploads/{logo,gallery,founder-photo,update-image}` |
| Pitch decks: PDF only, at most 5 MB, header and trailer checked, then `sanitizePdf()` rejects JavaScript, launch/submit/remote actions, attachments, XFA and encrypted files, and stores a rewritten copy | `app/api/uploads/pitch-deck`, `lib/uploads/pdf-safety.ts` |
| Pitch decks are served with `Content-Disposition: attachment`, `Content-Security-Policy: sandbox` and `X-Content-Type-Options: nosniff` | `app/api/uploads/serve/[...path]` |
| nginx allows multipart bodies up to 6 MB (`client_max_body_size 6m`) | live nginx config |
| A founder can only attach a pitch deck from their own upload path | `ownsPitchDeck()` in `lib/validators/pitch-deck.schema.ts` |

ClamAV was planned but is not installed: the VPS has 3.66 GiB RAM and the scanner needs at least 5 GiB free. The in-app PDF checks replace it. If signature-based malware scanning becomes a requirement, use a hosted scanning API or a larger VPS.

All seven upload entry points use the shared origin, verified/non-banned account,
attempt and storage-quota controls. Journal images remain admin-only; every image
path decodes/re-encodes pixels with an input-pixel bound. OG rendering accepts only
bounded first-party logo storage keys and LIVE parents, not remote profile URLs.

## Abuse controls

- Anonymous votes: one network identity per startup (trusted nginx `X-Real-IP`), with a 10-attempt/hour network budget. User-agent/cookie rotation and client-prepended forwarded headers do not reset it. Shared networks can share identities; this is not one-person verification.
- Comments and the contact form use Cloudflare Turnstile and Zod validation; comments are moderated before they appear.
- Comments, contact and beta requests also use the trusted proxy address without user-agent/forwarded-header input for their three-request/hour network limits. Rotating browser headers cannot reset those budgets.
- Beta request forms refresh their single-use Turnstile challenge after each attempt and keep applicant fields on recoverable errors. A duplicate concurrent request is treated as already saved; cache refresh failures are logged as delayed refreshes after the database write rather than returned as a failed save.

## Moderation and public data boundaries

Approval/rejection updates require a verified, non-banned moderator and encode
PENDING_REVIEW in the database predicate. They cannot unsuspend a startup.
Team/update helper reads constrain the parent to LIVE, or a verified owner/reviewer
management scope. Public approved-comment reads always require a LIVE parent.
Journal HTML is allowlist-sanitized on save and display (including old content);
JSON-LD escapes script-closing markup. Active embeds and inline styles/events are
not accepted. See the [sanitizer's documented configuration](https://github.com/apostrophecms/apostrophe/tree/main/packages/sanitize-html).

## Newsletter

An unchecked, specific consent choice plus Turnstile and network/address limits
protect capture. Pending requests use hashed, 24-hour tokens in Verification;
confirmation requires an explicit POST, not a GET opened by a mail scanner.
Only confirmed, non-withdrawn subscribers (`activeNewsletterWhere`) may receive
marketing. Legacy entries remain unconfirmed. Confirmation records consent version
and request/confirmation timestamps. Secret unsubscribe links do not require login.
There is no bulk newsletter sender: before adding one, enforce suppression, include
unsubscribe links/headers and confirm the company's complete postal address.

## Secrets

Email rendering escapes account-name/link interpolation, sends plain-text
alternatives, and bounds provider requests. Routine success/failure logs exclude
recipient addresses and provider response bodies.

- Production secrets live only in `/var/www/anshkosh-shared/.env` (mode 600) and in each release's private copy. GitHub Actions holds only the restricted deploy key (`VPS_SSH_KEY`) and pinned host keys (`VPS_KNOWN_HOSTS`).
- Never commit `.env`, private keys or database dumps. Never paste secret values into issues, PRs, chat or agent messages; refer to the variable name or file path instead.
- `pm2 jlist`, `pm2 env`, `dump.pm2` and raw logs can contain secrets. Filter them before sharing.

## Dependency remediation and residual risk (18 October 2026)

Compatible dependency refresh reduced the audit inventory from 27 original package
entries to 14 (12 high, 2 moderate), with no critical findings. The remaining entries
are chains rooted in three unresolved advisories; they are **not fixed or a clean
audit**:

- [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
  no published patch; glob tooling used by CLI/lint/build dependencies. Do not feed
  untrusted remote patterns to build or component-generation tools.
- [deepmerge-ts GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx):
  Prisma 6 configuration dependency; fixed on a different major. A Prisma 7/config
  migration needs its own reviewed compatibility work. No application handler
  imports this merger or accepts cyclic configuration objects.
- [postcss-selector-parser GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf):
  typography's v6 parser remains affected; forcing parser v7/downgrading typography
  is not compatible remediation. It processes trusted build styles, not submitted
  journal HTML. Reassess if dynamic user-supplied CSS is ever introduced.

`security/dependency-exceptions.json` pins these exact advisories and installed
versions through 18 November 2026, with rationale. CI reports them unresolved and
fails on any new/critical advisory, changed vulnerable version or expired review.
Do not silently extend reviews or use blanket audit suppression. Better Auth's
optional peer links can make CLI/test packages appear in `--omit=dev` audit output;
dependency placement alone is not a reachability argument. Prisma/shadcn are now
declared development tools, and no forced major upgrades/downgrades were used.

The local npm 10 resolver hit a documented optional-peer graph crash during the
Vitest-family patch update ([upstream issue](https://github.com/npm/cli/issues/9787)).
A one-off npm 12 invocation resolved the compatible lockfile; a fresh normal npm
10 `npm ci`, generated Prisma client and full checks verify reproducibility without
changing the server/global package manager. Lifecycle scripts still run normally
in the existing CI/deploy pipeline.

On 22 October, the main deployment audit newly reported
[manual mock code injection](https://github.com/advisories/GHSA-qxg6-89mg-rqv8)
and [Windows mock redirect traversal](https://github.com/advisories/GHSA-xp26-3454-mjgp)
in `@vitest/mocker` 4.1.11 after the site-review PR checks had passed. Vitest and
its matching coverage package are upgraded to the compatible 4.1.12 patch,
which includes the patched mocker. The existing audit gate and exceptions remain
unchanged; this update introduces no production application behavior or migration.
