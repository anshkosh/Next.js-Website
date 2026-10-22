# Account downloads and deletion

Settings exposes JSON export and account closure after profile and security.
Both require a verified, non-banned session and an emailed 128-bit random code.
The server returns only email-send status, never the code. Verification records
store SHA-256 hashes, bind the current email, account and purpose, expire after
15 minutes and are consumed transactionally. A new code replaces only the same
purpose's old code. Email changes invalidate outstanding proofs. A one-minute
cooldown and three request attempts/hour/purpose apply; confirmation attempts
are limited to ten/hour/purpose. Unavailable Redis protection fails closed.
Expired proofs are removed by the hourly retention job. No email link or GET
request performs deletion.

## Export

`POST /api/account/export` rejects untrusted/missing origins and extra fields,
limits the input body to 1 KB, and uses the current verified database session.
Owner-only Prisma projections run in a repeatable-read transaction. The export
includes profile/preferences, provider names, startup submissions/revisions,
updates and founder replies, journal content/revisions and recorded upload paths.
It excludes password hashes, OAuth/session credentials, applicants' contact
details, other people's comments and internal moderation/security records.
Attachments are referenced, not bundled; obtain wanted files before deletion.
PostgreSQL measures uncompressed owned content before the application loads rows;
accounts exceeding 20 MB use the support route. Compressed/TOAST storage sizes
are not used as the memory bound. Each large collection is capped at 10,000
records and the generated JSON at 25 MB;
larger accounts get a support error rather than an incomplete download. A failure
rolls back proof consumption. Successful responses are JSON attachments with
private/no-store, nosniff and no-referrer headers. Responses never name a user
in the filename or disclose internal error details.

## Deletion

The POST server action requires a deletion-purpose code and the literal `DELETE`.
It rechecks the user, verified email, ban status and current database session
under the user row lock. Staff/unknown roles cannot self-delete; they receive the
existing support contact for a responsibility handover. Better Auth's standalone
delete-user endpoint remains disabled; this does not enable a GET callback.

One transaction marks media for erasure, deletes owned journal revisions/entries,
detaches any other author's entry from the removed startup, removes owned startup
revisions/startups and editorial posts, removes direct-recipient notification
outbox entries and account proofs, then deletes the user. Startup foreign-key
cascades remove updates, votes, comments, founding-team records, redirects,
featured entries and beta programs/requests. User cascades remove every session
and linked credential/provider account. Database failure rolls everything back,
including proof consumption. No account id comes from the browser. Public caches
are invalidated only after commit; cache failure does not reverse a confirmed save.

## Upload erasure and races

`MediaUpload.erasureRequestedAt` is a durable storage-removal queue, not a user
foreign key. Marked objects are denied by the upload-serving route immediately.
The sync worker checks every minute, handles at most 20 rows per run and removes
a queue record only after object storage confirms deletion. `erasureAttempts`
rotates failures behind untouched work; failed jobs remain available for retry.
Only seven application upload prefixes are eligible; backups and unsafe keys
cannot be deleted. Logs do not contain object keys or confirmation codes.

Quota reservation, object writes, account erasure and cleanup share the existing
per-account uploads advisory lock. Reservation and writes recheck the owner;
writes recheck the reservation after acquiring the lock. A confirmed deletion
blocks late normal writes. Uncertain/timed-out writes retain cleanup records.
Storage calls have a ten-second timeout and transactions a fifteen-second budget.
The upload erasure migration is additive; worker schedules register on restart.

## Limits and validation

This is active account deletion, not a claim of erasure from every system.
Unlinked anonymous votes/comments, beta applications to other startups and the
separate newsletter subscription require their existing controls/support route.
Device-only drafts are cleared in the browser. Downloaded/cached copies cannot
be recalled. Backups are not automatically purged by this feature; operations
currently requires owner approval for backup deletion. Do not promise a fixed
backup expiry that has not been configured. Queue/system records and separately
collected records may need a broader privacy request.

Unit regressions cover ownership/purpose/email binding, expiry/replay, staff and
session protection, fail-closed limits, private projections, erasure retries and
late upload rejection. The isolated browser journey covers JSON download, private
applicant exclusion, proof replay/purpose separation, actual database rollback,
dependent deletion, another session's revocation and fixture object removal.
It refuses non-loopback/non-test databases. Never substitute production for
the isolated suite. The owner authorized release on 22 October 2026; required CI
must pass before merge and deployment.

After the erasure transaction commits and public visibility is invalidated, the
server redirects to `/account-deleted` outside the protected settings layout.
The no-index receipt refreshes the authoritative session to expire revoked
browser cookies; visiting it does not sign out a valid account. Failed erasure
stays in settings with an error and cannot redirect to the completion receipt.
