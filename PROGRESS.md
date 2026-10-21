# Progress

## 21 October 2026 — founder mode public visibility correction

- Owner reported that switching founder mode off left linked startups public,
  then explicitly chose hiding them everywhere, including direct startup links.
- Follow-up branch: `codex/founder-mode-public-visibility`, based on deployed
  main `9c9f068` (PR #46). The previous release is verified live.
- Public reads now require both LIVE startup status and the owner's founder mode
  enabled. Includes discovery, categories/counts, featured lists, search, ranking,
  direct/old-slug pages, metadata, sitemap, linked stories and public deck access.
- Existing data, review states, featured selections and owner/reviewer management
  permissions stay intact. No production accounts or bot activity are modified.
- Settings explains the change. Local lint/typecheck, 615 unit tests (two opt-in
  skipped), ten deployment tests and dependency policy pass. Optimized production
  build passes with isolated local configuration.
- Follow-up owner scope: move the switch to the dashboard; add all requested
  profile, email/password and notification settings. Implemented the immediate-save
  dashboard control, photo/bio/location/website, delivery preferences and verified
  account security flows. New additive migration: `20261021173000_account_profile_preferences`.
- Local browser regressions pass for member registration/dashboard switching,
  all-startup visibility/restoration and expanded profile/security settings.
  Verified optional email suppression, both email-change confirmation steps,
  password changes and other-device revocation. Desktop/tablet/mobile settings
  captures were inspected at 1366/768/390px with no horizontal overflow.
- PostgreSQL visibility/scoring restoration and two opt-in journal privacy cases
  pass on the isolated local database. Full Linux/PostgreSQL 15 CI remains the
  release gate. No production accounts were used for these tests.
- Login preserves pre-hydration typing in native fields and reads FormData on
  submit; the POST fallback remains. Approval emails now describe approval and
  dashboard visibility rather than claiming an off-mode listing is public.
- Full browser validation exposed draft-save revalidation racing the wizard's
  next step URL and reloading the editor. Draft-only saves no longer invalidate
  the already-dynamic dashboard; submitted/published writes retain invalidation.
  Team reads use an abortable, uncached GET with the existing visibility checks,
  avoiding the action navigation queue for background reads.

## 21 October 2026 — account settings and reported submission issues

- Branch: `codex/account-settings-founder-mode`, from verified live origin/main
  `fc77ca7` in a separate managed worktree. Other checkout changes are preserved.
- User scope: fix Grok's website reports, remove waitlist mentions, allow members
  and backers to register without founder mode, and enable profile settings for
  all accounts. User confirmed founder mode starts **on** and can be switched off.
- Implemented profile settings, registration/workspace preference, member dashboard,
  account-scoped browser tools and wizard recovery/validation/review fixes. See
  [account behavior](docs/wiki/product/Accounts-and-Founder-Mode.md).
- User-selected design skills were read. Existing identity is preserved; the
  founder mode switch uses Transitions.dev's reduced-motion-aware CSS. The GSAP
  skills informed motion/performance/React lifecycle choices; these task forms
  do not require scroll effects, a new motion library or framework conversion.
- Local verification: lint/typecheck/dependency policy pass; 607 unit tests pass
  (two opt-in skipped); ten offline Python tests pass; isolated PostgreSQL
  team/featured/rollback checks pass. Optimized production build passes with
  captured local configuration. Three existing reviewed advisories remain.
- The eleven existing browser journeys pass, including the expanded wizard refresh
  and feature validation checks. The new independent account journey also passes:
  verified member registration, profile persistence, mode changes and preserved
  startup data. PR #46 and main Linux/PostgreSQL 15 CI passed all twelve journeys.
- Local PostgreSQL is an isolated temporary version-16 cluster on loopback port
  55432, with a separate Redis on 56379 and captured email/storage/challenge
  fixtures. No local test targets production.
- Independent settings review covered 1366x900 desktop and 390x844 mobile.
  Corrected the off-switch contrast to 4.84:1; the reviewer scored that fix resolved.
  Documentation review confirms the incumbent design is preserved. Open navigation,
  dark mode and a slowed-motion visual review are not claimed as visually audited.
- PR #46 was merged and deployed with owner approval as `9c9f068`; release
  identity, health and workers were verified. No live account reset/retirement,
  bot execution or activity treatment changes were performed.
