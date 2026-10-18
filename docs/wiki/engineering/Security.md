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

- Production secrets live only in `/var/www/anshkosh-shared/.env` (mode 600) and in each release's private copy. GitHub Actions holds only the restricted deploy key (`VPS_SSH_KEY`) and pinned host keys (`VPS_KNOWN_HOSTS`).
- Never commit `.env`, private keys or database dumps. Never paste secret values into issues, PRs, chat or agent messages; refer to the variable name or file path instead.
- `pm2 jlist`, `pm2 env`, `dump.pm2` and raw logs can contain secrets. Filter them before sharing.
