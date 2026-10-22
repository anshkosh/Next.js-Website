# Accounts, founder mode and draft recovery

All members, backers, founders, reviewers and administrators can open `/settings`
to update their display name, profile photo, bio (500 characters), location,
website, startup-review emails and vote-milestone emails. Photos use the existing
image editor, rewrite, upload quotas and an owned-upload check on save. Profile
details do not replace a startup's published founding-team fields.
The email worker checks optional notification preferences at delivery time;
verification, recovery and essential messages remain independent. Newsletter
consent retains its existing double-opt-in/unsubscribe flow.

Email changes require confirmation in the current verified mailbox, then a link
sent to the new address; the sign-in identity changes only after both steps.
Settings offers verification resend for unverified identities, current-password
change (revoking other sessions), password recovery and signing out other devices.
Google-only accounts use recovery to create an email sign-in password.
Profile settings are linked from public, mobile, founder and admin navigation.

Founder mode starts **off** for new accounts, including Google registration, via
the shared Better Auth account-field default. The registration form offers an
unchecked opt-in. Existing accounts retain their saved preference. The original
database column's `true` default remains for compatibility with the historical
backfill; registrations explicitly persist the auth default or chosen opt-in.
Anyone can change their own mode later using the dashboard switch, which saves
immediately. The same control is also available in profile settings.

With founder mode off, the dashboard offers discovery, stories and feedback rather
than startup management. Starting a submission asks the member to enable founder
mode. Turning founder mode off also hides every owned startup publicly:
homepage, Discover/featured lists, categories/counts, search, leaderboard, startup
URLs and old-slug redirects, social previews and sitemap entries. Linked public
founder stories and public pitch-deck access follow the same visibility rule;
public comment, vote and beta signup actions reject hidden startups.

Existing startups, journal entries, votes, beta requests, featured selections and
account roles are preserved. Turning founder mode back on restores the previous
visibility of approved LIVE startups; drafts, suspended startups and unapproved
stories stay hidden. Owner/reviewer management access remains available through
its existing permission checks. Founder mode grants no moderation or account
administration rights. Backer accounts do not enable investments/payments.

Profile settings accept a strict allowlist (`name`, `image`, `bio`, `location`,
`websiteUrl`, `notifyStartupReviews`, `notifyVoteMilestones`) for the signed-in,
non-banned account. The dashboard action accepts only boolean `founderMode`.
Better Auth updates the current user. Existing admin/reviewer roles are independent
of this preference. No account ID, verification status or permission role is
accepted by either form. New profile fields and preference defaults use an additive
migration; existing account identities, moderation states and saved content remain.

## Account navigation and mode controls

The public header and founder top bar share an account menu with Dashboard,
Profile settings and Logout. Signed-in visitors to `/login` and `/register`
are redirected to their dashboard. Mobile navigation exposes the same destinations.

The dashboard places a compact founder-mode toggle beside the welcome heading,
at the top right on wider screens and below the greeting on phones. The old
bottom-of-dashboard card is removed. Only the switch and “Founder mode On/Off”
are visible in the dashboard header; help and save announcements remain available
to screen readers. Profile settings retains its full explanation and short-lived
Undo offer. Changes save immediately on both surfaces. Public
visibility and review-state rules above remain the same. Startup deletion uses
the shared confirmation dialog and stays at the bottom of each dashboard card.

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
