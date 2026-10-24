# Website changelog

## Unreleased — direct personal-abuse moderation safeguard

- Hold explicit personal attacks for human review even if the safety model labels
  their text safe; preserve ordinary product criticism and evidence questions.
- Add isolated regression cases for the reported public test insult and civil
  feedback. No existing comments, accounts or moderation settings are changed.
- Refresh compatible body-parser, fast-uri and zod lockfile versions to clear six
  newly reported advisory findings blocking the required dependency gate. Existing
  reviewed exceptions and direct dependency ranges remain unchanged.

## Unreleased — AI content moderation

- Add durable Cloudflare Workers AI text checks for new comments, founder replies, public journal revisions and startup updates.
- Keep private drafts out of AI; hold unsafe, malformed, unavailable and image/video submissions for human review. Public journals retain editorial approval.
- Add a shared 100-request UTC daily cap, exact-content race protection, pending update visibility, staged replies, human publication overrides and privacy disclosures.
- Preserve existing published records and scoring weights; Cloudflare Workers remains Free. Activation requires a scoped server credential and normal release approval.

## Unreleased — moderation visibility prerequisite

- Add an approved status default for startup updates and exclude non-approved updates from public profiles, cards, update helpers and activity counts. Existing content and new writes remain approved as before.
- This visibility-only release must deploy before AI moderation, so automatic rollback of the AI release cannot expose pending/rejected updates. No AI jobs, credentials or paid services are enabled.

## 23 October 2026 — legacy campaign indexing fix

- Permanently redirect the old Cane Theory campaign URL to its current startup
  profile, preserving query parameters. Keep absent legacy demo URLs as 404s.
- Record Search Console evidence and add an HTTP routing regression check.
- Update Next.js and its matching lint package to 16.4.2 to clear newly reported
  critical/high Next.js advisories blocking the required release gate.

## Unreleased — Jerry's founder-tools and website QA

- Remove device-only tool drafts at sign-out; protect loading and account changes,
  make clearing persist, and explain storage consistently.
- Correct manual MVP grouping, pitch grammar/formats, all-zero runway guidance,
  filenames, website formatting, tracker duplicates and optional outreach URLs.
- Link dashboard cards to profile-prefilled launch kits; keep reuse explicit.
- Return protected-page logins to safe local paths; add signup/favicon redirects,
  verification resend and visible signup/settings navigation.
- Keep the phone cookie notice clear of forms; improve mobile search and filters.
- Add startup-edit review, remove redundant recovery, require explicit reply edits
  and deletion confirmation, and align emoji limits between client and server.
- Correct section tabs, founder-mode feedback/Undo lifetime, singular wording,
  journal-cover loading feedback and search's signal breakdown.


## 22 October 2026 — account data controls

- Add account-data JSON download and permanent account deletion in settings,
  each protected by a separate single-use emailed confirmation code.
- Require a final DELETE confirmation, revoke all sessions and remove owned
  startup/journal records atomically. Staff closure uses a handover contact.
- Block queued upload links and retry storage removal durably. Keep password,
  provider tokens and other people's private records out of downloads.
- Explain separate records, device drafts and retained backup copies explicitly.
- Confirm completed deletion on a public receipt after revoking account sessions.

## 22 October 2026 — CSP and private account settings

- Enforce a fresh script nonce on HTML responses, while retaining CAPTCHA,
  approved video embeds, image editing and the PDF download sandbox.
- Add an optional private date of birth, including validation and removal.
- Add a prominent password shortcut in settings and an email-password setup
  path for Google-only accounts. Keep current-password verification and revocation
  of other sessions in the existing auth service.
- Label profile-save times explicitly in IST.
- Remove the duplicate founder-mode section from settings. Group profile,
  private personal details and notifications, with responsive section links.
  Password controls come before email changes and signing out other devices.

## 22 October 2026 — dashboard founder-mode placement

- Move the founder-mode switch beside the dashboard welcome heading, showing
  only the switch and “Founder mode On/Off.” Stack it below the greeting on phones.
- Default new registrations to founder mode off, with an unchecked signup opt-in.
  Preserve existing preferences and the full explanatory control in profile settings.

## 22 October 2026 — test-tooling security patch

- Upgrade Vitest and its matching coverage package to 4.1.12 to remove two
  mocker advisories newly reported by the release audit. Keep the dependency
  policy and existing reviewed exceptions unchanged.

## 22 October 2026 — site review polish

- Show combined vote and activity signals on public startup cards, profiles and
  the founder dashboard using the existing scoring rules.
- Refresh Discover cards with problem statements, latest updates, sorting and
  counts; show featured startups in the carousel without repeating them in the grid.
- Improve contrast, responsive account navigation and reduced-motion behavior;
  show the shortened homepage curtain once per browser session.
- Simplify dashboard cards and startup deletion, add founder mode with Undo to
  settings, and redirect signed-in login/register visits to the dashboard.
- Remove the footer newsletter form and listing note. The existing journal
  newsletter-anchor follow-up remains recorded in Content-and-SEO.md.

## Unreleased — founder visibility and account controls

- Hide all owned startup listings, direct pages, old-slug redirects, previews,
  search/sitemap/category entries and rankings when founder mode is off.
- Apply the same rule to linked founder stories, public decks and public
  comment/vote/beta signup actions. Keep owner/reviewer management access.
- Explain visibility in settings. Restore previous approved visibility when
  founder mode is enabled again, without changing saved data or review status.
- Move the founder-mode switch to the dashboard with automatic saving.
- Expand profile settings with an owned profile photo, bio, location, website,
  real email-delivery preferences, verified email changes, password changes and
  other-device sign-out. Keep verification/recovery and newsletter consent separate.
- Avoid route refreshes after draft-only saves and cancel background team reads
  when leaving a wizard step, preserving newly entered fields and features.

## 21 October 2026 — account settings and submission recovery (PR #46)

- Enable profile settings for every signed-in account, with name editing, email
  status and a saved founder mode preference. Founder mode defaults on; members
  and backers can disable it at registration or in settings.
- Provide a community dashboard with founder mode off, preserving existing work
  and account permissions. Add profile/settings and logout links across navigation.
- Rehydrate owned startup drafts, persist each Next, show feature-level errors,
  clear stale errors and saved-state warnings, and review the complete submission.
- Explain startup allowances/review status, correct founder headings/countdown,
  improve sentence-style pitches and show owner reply links/CAPTCHA guidance.
- Separate browser tool drafts by account and remove public waitlist wording.
- Update Vite and its compatible tooling dependencies to clear newly reported
  development dependency advisories. Existing reviewed advisory exceptions remain.

Earlier releases are recorded in Git history and
`docs/wiki/operations/Site-Swarm-Bugfixes-2026-10-20.md`.
