# Accounts, founder mode and draft recovery

All members, backers, founders, reviewers and administrators can open `/settings`
to update their display name and founder mode. Email identity is displayed with its
verification status; password recovery uses the existing email reset flow.
Profile settings are linked from public, mobile, founder and admin navigation.

Founder mode starts **on** for new accounts, including Google registration. The
registration form lets members and backers switch it off before creating their
account. Existing accounts retain founder mode through an additive `User` column
with a `true` default. Anyone can change their own mode later in Profile settings.

With founder mode off, the dashboard offers discovery, stories and feedback rather
than startup management. Starting a submission asks the member to enable founder
mode. Existing startups, journal entries, votes, beta requests and account roles
are preserved. Founder mode is a workspace preference; it grants no moderation or
account administration rights. Backer accounts do not enable investments/payments.

Profile settings accept a strict allowlist (`name`, boolean `founderMode`) for the
signed-in, non-banned account. Better Auth updates the current user. Its existing
admin/reviewer roles are independent of the workspace preference. No account ID,
verification status or permission role is accepted by the profile form.

## Startup submissions

The new-submission page checks the account allowance before starting a new form.
At the limit it resumes an owned draft, or explains how to manage existing entries.
Quota enforcement remains atomic on the server.

Every Next saves the draft before advancing. The URL records the draft ID and
current step; refresh loads only an owned DRAFT from the server. A save-triggered
refresh must render the wizard in place, rather than redirecting to Step 1.
Controlled form fields wait for hydration before accepting input.

Feature title/description errors identify their input, and the review includes
category, complete proposition, logo, contact/social details, team, media and all
features, with links back to each step. A successful draft save resets the unsaved
state and announces its time. Restore and navigation clear stale validation errors.

Device recovery stays separate from a confirmed server save. Unsaved changes are
recoverable for seven days where browser storage works; unavailable storage is
reported. Recovery keys are scoped to the account and draft. A recovery copy does
not submit or publish a profile.

## Free tools and discussions

Free-tool drafts, including the launch checklist, use separate storage namespaces
for each signed-in user and for anonymous visitors. Legacy global drafts are not
imported automatically because their owner is unknown. These are browser-local
copies, not account sync or encrypted storage; users should avoid shared devices.

Sentence-style pitch approaches remain separate sentences. Public discussion
explains the CAPTCHA requirement and offers startup owners links to the reply
editor for each approved comment. Replies use the existing authorized founder
reply action, rather than submitting another top-level comment.

Public waitlist wording has been removed. The old `/waitlist` address remains only
as a redirect for existing external links; it does not collect registrations.

Account retirement, credential resets, bot execution and changes to ranking/test
activity are outside this website change. The report's intermittent first-click
Turnstile failure remains unconfirmed; challenge protections stay enabled.
