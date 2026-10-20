# Site-swarm bug review — 20 October 2026

Owner requested review and fixes in the Codex chat. Source reports: Jerry's
post-office messages #298 and #309, thread `anshkosh-site-bugs`. Work starts from
production/main `1d18154`. These statuses describe the proposed change, not a
production deployment. The existing worktree's unfinished basics/journal changes
were left alone; this work uses `codex/site-swarm-bugfixes`.

## Findings and disposition

| # | Report | Result |
|---|---|---|
| 1 | Credentials appear in early form-submit URLs | Confirmed. Login, registration, admin login, password reset and recovery use explicit POST, including before hydration. Eight credential-bearing records were found in the active nginx access log; only counts were inspected. `deploy/redact_auth_log.py` previews without printing values. Explicit apply rotates/reopens logging, preserves all records in a redacted archive, verifies it and removes the private raw temporary. No redaction has been applied yet. No external analytics integration was found in the source. Browser/tool history outside the VPS was not inspected or purged. |
| 2 | Test passwords exposed | Rotation remains deferred while Jerry's Round 3 is running. No password, session or account permission changes are part of this fix. Coordinate a separate reset after the test ends. |
| 3 | `/waitlist?role=founder` is 404 | Confirmed. Legacy founder links redirect to `/startup/new`; the existing auth guard sends anonymous visitors to registration. |
| 4 | Homepage and leaderboard disagree | Not reproducible on the current release. Both use `getLeaderboard`, and public reads returned Cane Theory, DroneHire, GST Saathi, Kabadiwala Connect and MarginMitra in the same order. The reported “ranked by net signals” and “Top featured” strings are absent from the homepage section. No scoring or test-activity treatment changed. |
| 5 | Logged-out votes count | Intentional current product behavior, documented on the leaderboard and covered by existing trusted-IP abuse-control tests. Authentication-only voting would be a product-policy change. |
| 6 | Intermittent generic comment failure | No matching comment-error records were found in current PM2 or release application logs. Confirmed failure paths were repaired: cache refresh cannot turn a committed save into failure; receipt-write failure also preserves success; rejected submissions obtain a fresh CAPTCHA; failed script loads can be retried; expiry/timeout/error callbacks clear stale tokens. A lost network response explicitly asks the author to check pending receipts before retrying. This is not proof of the historical exception's exact cause. |
| 7 | Rate error appears after CAPTCHA | Read-only network allowance check occurs before the widget renders and before verification. Exhausted networks see the shared 3/hour rule and retry-after estimate. The atomic post-verification check remains authoritative under races. Protection unavailability fails closed. |
| 8 | “Kerala” returns no results | Jerry clarified that DocLoop and Saree Second mention Kerala in their public audience text. Search now includes the published `targetAudience` field alongside descriptions and city, with unit and browser regressions. No private metadata, pending revisions, guessed geography or new state field was added. |
| 9 | Missing Cane Theory journal URL | Expected 404. The owner confirmed in this chat that the article was deliberately deleted on 19 October. Source search and read-only checks of published journal content/canonicals, startup descriptions/links and eligible public founder entries found no stale references. Leave it deleted; no restoration, replacement article or unrelated redirect is needed. |
| 10 | Signed-in comment identity not prefilled | Form receives only the current viewer's name/email from the request-scoped session and prefills both. Authors can still choose their submitted display name; comment email remains private. |
| 11 | No posting identity indicator | Header shows the signed-in name on desktop/mobile; discussion form explicitly says who is signed in. Session lookup is shared per request. |
| 12 | Own pending comments invisible | Submission returns a private pending receipt. A bounded HMAC-signed HttpOnly cookie lets the submitting browser reload up to 20 pending comments for seven days. Retrieval requires the signed IDs and the same LIVE parent, returns no emails, and never treats an unverified email as proof of authorship. Receipts do not sync across browsers/devices. Public totals/rankings still include only approved eligible activity. |
| 13 | Signed-in visitors see preview gate | Authenticated homepage requests bypass both the curtain and construction banner. Anonymous preview behavior remains covered. |
| 14 | Floating controls cover mobile text | Contact/top controls are hidden below the desktop breakpoint and while the storage notice is visible. Footer contact links remain available. Narrow discussion padding also leaves room for Turnstile's 300px minimum. |
| 15 | Delete action hidden | A visible, labeled “Delete startup” button replaces the ellipsis menu. Existing confirmation and owner checks remain. No startup was deleted for this review. |
| 16 | Password paste blocked | No paste-prevention handler was found in the password component or auth forms. Browser-native paste remains allowed; admin inputs now also have password-manager autocomplete/name attributes. Native form regression checks cover all five forms. |
| 17 | No article sharing | Existing copy-link control is retained; an explicit share button invokes native sharing or copies the link with useful failure feedback. |
| 18 | Turnstile CSP warnings | The current public response has neither CSP nor report-only headers and no CSP meta tag. No application policy block was reproduced, so no security policy was weakened and no CAPTCHA bypass added. Widget recovery improves actual load failures. Provider-owned frame messages still need an exact error code/screenshot if they persist. |
| 19 | Bluelearn copy/layout glitches | Public rendering suppresses an excerpt repeated at the start, preserves citation superscripts, orders numeric citation groups, and provides full-size image links. Sharing is explicit. A reviewed content script aligns the H1 with the existing SEO title and replaces the nonexistent article-comment CTA with a link to the real footer newsletter form, updating HTML and Quill together. The source preserves sourced facts. Data corrections have only been previewed. A once-blank cover was not reproduced; no screenshot was available. |
| 20 | Fundraising-style category labels | Optional reviewed names: Campaign Notes → Pilot Notes; Funding Fundamentals → Startup Finance Basics; Capital Explained → Startup Costs Explained; Backer Field Guide → Supporter Field Guide. Existing slugs and article assignments are preserved. Changes require the explicit `--rename-categories` apply flag; preview succeeded, no database names changed yet. |

## Release and manual steps

Use the normal owner-approved PR/CI/merge pipeline. Do not edit an immutable live
release or bypass checks. Jerry requested advance notice before a comment-form
deployment and identified 12:45 and 14:45 IST posting windows. No bots were run,
votes cast, real comments posted, passwords reset or ranking policies changed.

After approval and a successful release, the article correction runs from the new
release as deploy with its existing protected environment, under the deploy lock:

```text
node scripts/correct-site-swarm-content.mjs
node scripts/correct-site-swarm-content.mjs --rename-categories
# Apply only the approved preview, with a fresh verified backup and private audit:
node scripts/correct-site-swarm-content.mjs --apply --backup-state <protected-backup-state> --audit-dir <private-audit-directory>
# Add --rename-categories only if the four reviewed display-name changes are approved.
```

The script rejects changed/unpublished articles and concurrent edits, preserves
URLs/assignments, writes a private before/after audit and is idempotent. Do not seed
or restore the database to perform these narrow corrections.

For log cleanup, run the reviewed Python tool as root in preview mode first. It
prints counts and a digest, never URLs/values. After approval use `--apply
--expected-lines <fresh-preview-count>`. It supports only the exact active nginx
access log, reopens files using USR1 without restart/routing changes, waits for old
writers, verifies a record-preserving redacted archive and removes the raw
temporary. A failure retains private recovery material; investigate on-server
without exporting logs. The archive name ends in `.log` for the existing rotation.

## Verification

Local lint/type checks, unit regressions, dependency-policy checks and offline
Python checks are run before PR handoff; final counts are recorded in the PR.
The dependency policy still reports three reviewed unresolved advisories; it is
not a clean vulnerability audit. Browser/real-PostgreSQL CI must pass. Docker was
not running on the operator machine, so no local database/browser pass is claimed.

New browser checks cover a real native POST with JavaScript disabled and a
signed-in comment whose pending receipt survives reload while another browser
cannot see it. Widgets use a captured API and the isolated development server;
there is no production verification bypass. Existing scoring/concurrency/browser
regressions still run. Source and manual-step previews do not mean deployed.

Cloudflare references used for widget behavior:
[configuration and expiry](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/),
[single-use tokens and reset](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/),
[CSP requirements](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).
