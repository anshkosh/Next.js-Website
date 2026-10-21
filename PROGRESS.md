# Progress

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
  startup data. Full Linux/PostgreSQL 15 CI is the remaining release gate.
- Local PostgreSQL is an isolated temporary version-16 cluster on loopback port
  55432, with a separate Redis on 56379 and captured email/storage/challenge
  fixtures. No local test targets production.
- Independent settings review covered 1366x900 desktop and 390x844 mobile.
  Corrected the off-switch contrast to 4.84:1; the reviewer scored that fix resolved.
  Documentation review confirms the incumbent design is preserved. Open navigation,
  dark mode and a slowed-motion visual review are not claimed as visually audited.
- No merge, production deploy, live account reset/retirement, bot execution or
  changes to ranking/activity treatment are authorized or performed by this task.
