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

**Known gap:** the admin-only journal image upload (`app/api/uploads/journal`) stores files as uploaded, trusting the browser's MIME type, without `sharp` re-encoding. Fix it before giving journal access to anyone other than trusted admins.

## Abuse controls

- Upvotes: one per visitor per startup, enforced by a fingerprint hash (IP + user agent), a visitor cookie (`anshkosh_vid`) and a rate limit of 10 upvotes per hour per fingerprint.
- Comments and the contact form use Cloudflare Turnstile and Zod validation; comments are moderated before they appear.

## Secrets

- Production secrets live only in `/var/www/anshkosh-shared/.env` (mode 600) and in each release's private copy. GitHub Actions holds only the restricted deploy key (`VPS_SSH_KEY`) and pinned host keys (`VPS_KNOWN_HOSTS`).
- Never commit `.env`, private keys or database dumps. Never paste secret values into issues, PRs, chat or agent messages; refer to the variable name or file path instead.
- `pm2 jlist`, `pm2 env`, `dump.pm2` and raw logs can contain secrets. Filter them before sharing.
