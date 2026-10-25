# AI-assisted content moderation

This release uses the existing VPS sync worker and Cloudflare Workers AI directly.
It does not deploy a Cloudflare Worker, use AI Gateway credits, or change Arush's
R2 account. Keep the Anshkosh Cloudflare account on **Workers Free**.

## Publication rules

| Submission | Behavior |
| --- | --- |
| New public comment | Save pending; publish automatically after a safe AI result with no policy flags, or after human approval. Blunt criticism of the product is allowed. Comment email is never sent to AI. |
| Founder reply or reply edit | Stage the replacement privately; retain any approved reply until the replacement is approved. Rejection discards only the staged replacement. |
| Startup update or edit | Save pending and hide from public projections and activity counts until approval. Editing an approved update hides that update during review. |
| Public founder journal revision | Show an AI assessment alongside the submission; a reviewer still approves publication/scheduling. The approved version remains live during review. |
| Private journal draft | Never enqueue or send to AI. Withdrawing/deleting a revision cascades its moderation metadata. |
| Image/video attachment | AI checks text only. Hold the submission for human media review even if text is safe. |

Only new submissions and edits enter the AI queue. Existing published activity,
test/bot accounts, ranking weights and legacy content are not reclassified. The
additive migration defaults existing startup updates to APPROVED. New application
writes explicitly set PENDING. All public update reads and scoring SQL require
APPROVED; this preserves existing signals and excludes new unapproved content.
Blunt negative product feedback such as “this product sucks”, “your app is useless”
or “the design is garbage” does not trigger a language flag on its own. Possible
physical threats, attacks on people and profanity add review hints that prevent automatic
publication even if the model returns safe. The shared English/Hindi/Hinglish
patterns are conservative review aids, not a complete toxicity classifier or
proof of misconduct. An unsafe or unavailable AI result still stays pending.

Personal-attack hints cover the reported non-profane wording “you are a clueless
fraud” and “an incompetent clown”, including the “nobody with a working brain”
variant. Adjective allowances remain bounded and person-directed; criticism of
an app, its onboarding or a fraud-detection product does not trigger those hints
by keyword alone. Quoted or ambiguous personal-attack wording can still be held
for context; the hint never automatically bans a user or deletes a submission.

Physical threat patterns include explicit plans to arrive at a place and damage
people's property, including fixture and booth damage. Ambiguous or new threat
wording can still escape phrase matching, so the safety model and review queue
remain important.

The comment composer shows a warning when it detects threatening language,
personal insults or profanity, so the author can rewrite before submitting.
If submitted anyway, the server saves it privately for review and returns the
same warning on screen. The filter does not silently rewrite the author's words.

## Review screens

- `/admin/content-review`: pending, flagged and unavailable checks, with exact-text
  approval/rejection for verified, non-banned admins/reviewers. Open submitted image
  attachments and review them before approving. Review threats and personal abuse
  separately from harsh feedback about a product's quality or commercial value.
- `/admin/content-review?view=published`: reviewed/AI-approved content; reviewers
  can hide a current comment, reply or update after publication.
- `/admin/founder-journal`: editorial decisions and AI assessment for public
  journal revisions. A human may override the AI assessment.
- `/admin/comments`: existing manual comment approval remains available, including
  pre-release pending comments that have no AI job.
- `/admin/comments`: filter the queue by pending, published or hidden/rejected;
  search commenter, private email, comment text and startup; restore a hidden
  comment or hide a published one. Product criticism remains eligible to publish.
- `/admin/bans`: review and reverse account bans and comment-only email blocks.
  A reviewer can ban an ordinary account only when a comment was linked at
  submission to that account's verified email. The action records a reason and
  duration, writes Better Auth's supported ban fields and revokes current sessions.
  Staff accounts are not ban targets, and reviewers do not gain general account,
  role or session-management access.
- An email-only block is available only for a verified account-linked comment.
  Its email key is an HMAC using the server's `BETTER_AUTH_SECRET`; raw email is
  not duplicated into the restriction table. Anonymous, unverified email values
  cannot be used to restrict someone else's address. Expired blocks stop applying;
  moderators can remove active restrictions from `/admin/bans`. Preserve the
  HMAC key during secret rotation or re-key active blocks before removing the old
  secret; account deletion removes that account's linked ban and hash records.

Rejected updates remain editable by their owner. Rejected reply replacements can
be resubmitted through the reply editor. Contact `hello@anshkosh.com` for human
reconsideration. AI safety classification is not evidence verification or a
guarantee of scam detection; business-policy hints send ambiguous cases to review.

## Configuration and zero-overage policy

The VPS needs these **server-only** variables in its protected shared environment:

| Name | Value/purpose |
| --- | --- |
| `AI_MODERATION_ENABLED` | `true` after connection verification; absent/false stops inference. |
| `MODERATION_CF_ACCOUNT_ID` | The Anshkosh Workers Free account; independent of `R2_ACCOUNT_ID`. |
| `MODERATION_CF_API_TOKEN` | A private token restricted to this account's Workers AI Read/Edit permissions. Never put it in Git, logs, chat, a PR, or `NEXT_PUBLIC_*`. |

Create the account-scoped credential only with owner authorization. Do not grant
AI Gateway, R2, DNS, billing or other resource permissions. Save it privately on the
VPS using the established maintenance procedure, preserve `.env` permissions
`600 deploy:deploy`, and keep a protected configuration backup. Release/runtime
configuration must use the same values for web and sync worker. Never paste a
credential into a shell command, command-line argument or chat message.

The fixed model is `@cf/meta/llama-guard-3-8b`. The code permits **100 requests per
UTC day across all workers**, reserved atomically in PostgreSQL. Requests have a
15-second timeout, at most 14,000 input characters, and at most 64 output tokens.
The sync worker processes at most five submissions each minute. Transient failures
retry up to three times; exhausted checks remain available for human review.

The request cap is an additional guard, **not a dollar spending cap or a neuron
counter**. Workers Free's 10,000-neuron daily limit is the provider-enforced cutoff.
Keep Workers Free and do not buy credits, enable paid fallback or upgrade Workers.
Other account workloads can consume that same free allowance. A quota response or
the local cap keeps submissions pending until human review or the next UTC day
(05:30 IST; retries resume just after that reset). Billing alerts only send warnings.

Sources: [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/),
[model](https://developers.cloudflare.com/workers-ai/models/llama-guard-3-8b/),
[REST setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/),
[data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/).

## Reliability and privacy

`ContentModeration` stores a content hash, verdict/reasons, attempts, lease and
reviewer metadata. Text remains only on its owning source record. Foreign keys
cascade when comments, updates or revisions are deleted, including account erasure.
Pending reply text is included in the owner's private account export.

Jobs are committed in the same database transaction as submissions. Leases and
conditional writes protect overlapping workers, resubmissions and human decisions.
After inference, the source and content hash are checked again within the publishing
transaction. A stale or malformed result never publishes. Startup update approval,
deletion and counter recount use the parent lock/transaction. Journal drafts are
re-read with a PUBLIC and pending-review predicate before an external call.

There is no AI Gateway logging/caching. Only submitted public text/display names
are sent for stateless inference. Do not log provider response bodies, submitted
text or credentials. Model categories and locally generated review hints are
stored; unconstrained model explanations are not. A submission made private while
its already-started inference request is running cannot retract that request;
the returned result is discarded and cannot publish it.

## Checks and rollout

1. Deploy prerequisite [PR #56](https://github.com/anshkosh/Next.js-Website/pull/56) first and verify its release. It adds the update status/public filters without pending writers. This must be the rollback baseline (or a later compatible release) before [PR #55](https://github.com/anshkosh/Next.js-Website/pull/55) introduces pending updates. Never roll the AI release back to a pre-guard reader.
2. Run lint, typecheck, dependency policy and the complete unit suite.
3. Run the PR's disposable PostgreSQL/browser gate. The new moderation fixture
   replaces fetch with fixed responses and refuses any database other than
   loopback `anshkosh_e2e`; it never calls Cloudflare or production.
4. Review the additive migration and approve the PR through the normal deployment
   workflow. The new table's cascade foreign keys are rejected by the conservative
   SQL scanner, so `deploy/deployment-policy.mjs` pins this exact migration's
   SHA-256 (`598b2c853ba29c8376d97574161d24b56e195e0a0e639776b5c6410586fd6d8a`).
   Install that reviewed policy on the VPS using the existing [reviewed-migration
   procedure](Deployment.md#reviewed-migration-exceptions), with owner approval,
   deployment lock, backup, root ownership, syntax/policy checks and atomic
   replacement. Do not broaden or bypass the scanner. No bot runs, content
   backfills or production seed operations.
5. Connect the account-scoped credential and verify representative English, Hindi
   and Hinglish samples against the live model before enabling automatic inference.
   Unit fixtures are not evidence of model accuracy in those languages.
6. Verify a new submission, pending receipt, approval, human override and provider
   failure without exposing private data. Confirm Workers remains Free.

Setting `AI_MODERATION_ENABLED=false` stops AI calls without publishing pending
content. Human review remains available. Roll back only through the standard
compatible-release procedure; do not reverse the additive migration or erase
moderation/source records as a rollback shortcut.
