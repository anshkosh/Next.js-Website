# Website changelog

## 22 October 2026 — account data controls (local preparation)

- Add account-data JSON download and permanent account deletion in settings,
  each protected by a separate single-use emailed confirmation code.
- Require a final DELETE confirmation, revoke all sessions and remove owned
  startup/journal records atomically. Staff closure uses a handover contact.
- Block queued upload links and retry storage removal durably. Keep password,
  provider tokens and other people's private records out of downloads.
- Explain separate records, device drafts and retained backup copies explicitly.

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
