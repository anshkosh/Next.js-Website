# Accounts, founder mode and draft recovery

All members, backers, founders, reviewers and administrators can open `/settings`
to update their display name, profile photo, bio (500 characters), location,
website, startup-review emails and vote-milestone emails. Photos use the existing
image editor, rewrite, upload quotas and an owned-upload check on save. Profile
details do not replace a startup's published founding-team fields.
An optional date of birth is stored as a validated calendar date (YYYY-MM-DD),
separate from public profile projections. Empty means unspecified. Owners can
clear the input and save to remove it. It is not proof of age or a new age gate.
The email worker checks optional notification preferences at delivery time;
verification, recovery and essential messages remain independent. Newsletter
consent retains its existing double-opt-in/unsubscribe flow.

Email changes require confirmation in the current verified mailbox, then a link
sent to the new address; the sign-in identity changes only after both steps.
Settings offers verification resend for unverified identities, current-password
change (revoking other sessions), password recovery and signing out other devices.
Google-only accounts use recovery to create an email sign-in password.
Settings groups profile, private personal details and optional notifications before
sign-in/security. A desktop side menu becomes a compact two-column jump menu on
phones, with direct links to each group, password, email and other devices.
The password form comes before email changes and device sign-out.
Password accounts use the existing current-password change form; Google-only
accounts see a labelled password-setup email path. Profile-save confirmations
explicitly use Asia/Kolkata and include the IST label.
Profile settings are linked from public, mobile, founder and admin navigation.

Founder mode starts **off** for new accounts, including Google registration, via
the shared Better Auth account-field default. The registration form offers an
unchecked opt-in. Existing accounts retain their saved preference. The original
database column's `true` default remains for compatibility with the historical
backfill; registrations explicitly persist the auth default or chosen opt-in.
Anyone can change their own mode later using the dashboard switch, which saves
immediately. Founder mode is managed on the dashboard only; settings has no
duplicate toggle, explanation or Undo offer.

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
`websiteUrl`, optional `dateOfBirth`, `notifyStartupReviews`, `notifyVoteMilestones`) for the signed-in,
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
bottom-of-dashboard card is removed. The dashboard header shows the switch, “Founder mode On/Off,” and visible save/error feedback. A successful save shows its IST time and a 30-second Undo offer, kept in memory across the dashboard layout refresh but cleared on reload or navigation. Explanatory help remains available to screen readers. Profile settings has no founder-mode control. Changes save
immediately on the dashboard. Public
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

When a visitor arrives from an anonymous `/startup/new` request, the validated
local return path is retained through registration, email verification, resend,
and sign-in. Registration explains that founder mode is needed for listing and
checks it for this explicit listing journey; the person can opt out. Other new
registrations keep the existing unchecked preference, and established accounts
retain their saved mode. Signed-in visits to login or registration return to the
validated requested page when supplied, or the dashboard by default.

Startup fields use programmatic labels and connect inline validation to each
control. The step summary links to the affected fields, and schema validation
messages describe the limits and correction. The first-step server draft action
is available once the required name, tagline and category are valid. Saving a
browser recovery copy alone is not described as a server save.

Feature title/description errors identify their input, and the review includes
category, complete proposition, logo, contact/social details, team, media and all
features, with links back to each step. A successful draft save resets the unsaved
state and announces its time. Restore and navigation clear stale validation errors.

Device recovery stays separate from a confirmed server save. Unsaved changes are
recoverable for seven days where browser storage works; unavailable storage is
reported. Recovery keys are scoped to the account and draft. A recovery copy does
not submit or publish a profile. Recovery copies identical to or older than the current server revision are discarded. Editing an existing startup has a validated review/confirm step before saving.

## Free tools and discussions

Free-tool drafts, including the launch checklist, use separate storage namespaces
for each signed-in user and for anonymous visitors. Legacy global drafts are not
imported automatically because their owner is unknown. These are browser-local
copies, not account sync or encrypted storage. Inputs wait for identity and draft loading. Signing out removes all free-tool drafts from this browser, including old global keys and memory-only copies; blocked cleanup is reported. Download results first. Clear controls remove persisted data, including duplicated shared kit fields, and confirm the result. Each dashboard card links to its owner-checked launch kit for explicit profile reuse.

Sentence-style pitch approaches remain separate sentences. Public discussion
explains the CAPTCHA requirement and offers startup owners links to the reply
editor for each approved comment. Replies use the existing authorized founder
reply action, rather than submitting another top-level comment.

Public waitlist wording has been removed. The old `/waitlist` address remains only
as a redirect for existing external links; it does not collect registrations.

Account settings also provides emailed-code account data downloads and deletion;
see [Account privacy controls](../engineering/Account-Privacy-Controls.md).
Credential resets, bot execution and changes to ranking/test activity are outside
the site-review change. The report's intermittent first-click
Turnstile failure remains unconfirmed; challenge protections stay enabled.

## 22 October QA follow-up

Protected-page sign-in carries a validated local return path; a direct sign-in still
lands on dashboard. `/signup` redirects to `/register`, and public navigation has
Sign up. Login/registration link to verification resend. Search uses published
founding-team names and displays votes plus the existing activity signal total.
Guest votes do not require sign-in. Comment/reply counters and server limits count
user-perceived characters consistently. Published replies open for editing only
on request and require confirmation for deletion.

The phone cookie notice is in document flow below content, so it cannot cover
forms. See the [complete QA disposition](../engineering/Jerry-QA-2026-10-22.md)
for both source reports, confirmed fixes and intentional product behavior.
