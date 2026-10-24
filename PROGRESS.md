# Progress

## 24 October 2026 — direct personal-abuse review safeguard

- Daily operating session independently found the reported Gaurav/WardDesk test
  insult still public on release `1d18b8f`. Existing review hints did not cover
  personal abuse; a `safe` provider response therefore passed it in an isolated
  regression. Four attack cases failed before the patch, with 32 cases passing.
- Added a bounded English direct-personal-attack hint that sends matches to human
  review. Civil criticism, requests for evidence, fraud discussion and a report of
  being insulted remain eligible in the negative regression cases. Quoted or
  ambiguous direct-attack wording can be held for contextual human review.
- Focused policy/worker/review suites pass: 55 tests. Lint, typecheck and all ten
  deployment-helper Python tests pass. The full suite initially had three
  pre-existing reviewed-migration hash failures from this Windows checkout's CRLF
  conversion. Restored the two SQL fixtures to their canonical LF bytes, verified
  both pinned hashes without changing Git content/policy, and all 15 deployment
  policy tests pass.
- The complete moderation suite passed 755 tests with two existing skips after
  restoring the canonical SQL fixture bytes. The dependency gate then exposed six
  newly unreviewed findings in the existing lockfile. Compatible lockfile updates
  to body-parser 2.4.0, fast-uri 3.1.9 and zod 4.6.7 clear those six findings.
  Dependency policy now passes with zero policy failures; the two existing
  version-pinned exceptions remain unresolved and were not broadened/extended.
  Final checks against the updated lockfile pass: 755 unit tests/two existing
  skips, zero-warning lint, typecheck and the dependency gate. All ten deployment
  Python tests pass. This library/policy change adds no database/schema or route
  behavior; no isolated browser/DB or live-provider run is claimed.
- No live model call, bot run, production data/configuration change,
  existing-comment rescan or deletion was performed.
- Grok relayed a five-test-comment cleanup request. Exact public IDs were captured;
  the two held IDs still require a private administrative lookup. Cleanup remains
  separate and awaits direct owner authorization; unrelated WardDesk discussion,
  accounts, votes and ranking policy must remain intact.

## 23 October 2026 — AI content moderation

- Owner requested implementation after confirming the account split: Anshkosh Workers Free for AI/Turnstile, Arush R2 for storage. Separate branch/worktree starts at current origin/main c97d049.
- Implemented durable text checks, safe-only automatic publication, human journal/media review, exact-submission comparisons, staged reply edits, pending startup updates, shared daily request reservations and review overrides.
- No production content, bot activity, account plans, paid credits or R2 settings changed. Existing published records remain approved; new pending updates are excluded from public reads/signals.
- Typecheck, zero-warning lint and dependency policy pass; CI passed 747 unit tests with two existing skips, ten deployment Python tests and all isolated PostgreSQL checks including moderation races and the shared cap. The browser job reached journey sixteen without an assertion failure before its twenty-minute job deadline; dependency installation consumed ten minutes. Increase only the job budget to thirty-five minutes and rerun the complete gate.
- Safe rollout is split: visibility guard PR #56 passed and is merged as 5ab87cf; its production workflow is running. AI PR #55 follows after the guard is verified live and its own complete CI passes.
- Owner explicitly authorized commit, merge, VPS deployment and creation/private VPS storage of the restricted Workers AI token. Activation still requires live synthetic English/Hindi/Hinglish checks, protected configuration and the reviewed root-owned migration policy installation. See docs/wiki/operations/Content-Moderation.md.

## 23 October 2026 — moderation rollback visibility prerequisite

- Prepare a small prerequisite release for AI moderation: additive StartupUpdate status defaulting to APPROVED and public visibility/counter filters. No pending writers or AI calls are introduced here.
- Deploy this first and verify its release before the AI feature. Once AI moderation is active, rollback targets must contain this visibility guard or a later compatible implementation.
- Existing published activity, new-update publication behavior, bot accounts, scoring weights and Cloudflare plans remain unchanged.

## 23 October 2026 — Search Console legacy campaign 404s

- Owner authorized the fix list. Branch `codex/search-console-404-fix` starts from
  current main `837e0cb` in a separate worktree; unrelated changes are preserved.
- Added an explicit permanent Cane Theory campaign-to-startup redirect. Archived
  source identifies LoopLane/GlassWing Robotics as fictional demos; no public
  replacements exist, so their 404s remain. No content/account/activity changes.
- The audit checked all 92 sitemap pages and found no campaign HTML links.
- Verification and release status will be recorded after the required gates.
- The dependency gate found three unreviewed Next.js advisories, including critical
  findings. Updated Next.js/eslint-config-next from 16.3.8 to 16.4.2; the dependency
  gate now passes with the same three existing, version-pinned exceptions. No
  security exception or release gate was relaxed.

## 22 October 2026 — signup redirect behind the production proxy

- Jerry fixes released as `d0c8910` via merged PR #52; 698 unit tests, all
  17 browser scenarios and PostgreSQL checks passed. Public release/DB health
  verified, along with home, login, registration and launch-tool pages.
- Public smoke found `/signup` deriving its absolute redirect from the proxy’s
  internal `localhost` URL. Return a relative `/register` Location instead.
  The owner’s fix-and-deploy authorization covers this correction.


## 22 October 2026 — Jerry QA report fixes (prepared, not deployed)

- Owner authorized fixes for both Jerry reports. Branch `codex/jerry-report-fixes`
  starts from main `84e4780`; unrelated worktrees and production data are untouched.
- Added tool sign-out cleanup, disabled pending inputs, reliable clearing, corrected
  pitch/MVP outputs, profile-kit access, optional tracker URLs and duplicate checks.
- Corrected local login returns, mobile cookie/search layout, signup/favicon
  redirects, verification resend, startup edit review/recovery, reply controls,
  grapheme limits, section tabs, save feedback and search signal display.
- Dense tie ranking, retired waitlist handling and pilot behavior remain intended.
  Lakshmi’s Saree Second reply is present on current live; public page errors did
  not recur. No fabricated data restoration, bot activity or ranking reweighting.
- Evidence and every report item: `docs/wiki/engineering/Jerry-QA-2026-10-22.md`.
  Final full local suite: 697 pass, two optional skips. Lint/typecheck/build,
  dependency policy and ten deployment-helper tests pass; 390px production-preview
  forms/tools/search checked.
- Draft PR #52 (source `eebe02b`) is pushed. Required run `39801525023` did not
  start its code or browser job: both annotations cite failed GitHub account
  payments/spending limits. Local Docker startup also failed to expose an engine.
  Billing is restored and run `39803225559` passed the code/DB checks. The new
  browser journey exposed dropdown labels containing option text; explicit label
  associations correct that accessibility issue. Required gates are rerunning.
  Owner explicitly authorized fixing and deploying; merge waits for passing CI.
- Release verification found and fixed delayed wizard validation autofocus stealing
  the next field’s input. Login-return assertions were updated and cold category
  compilation gets a bounded 60-second warm-up with a required 200 response.
  Fifteen browser cases pass; expanded route compilation exhausted the isolated
  dev server’s 5 GB V8 cap, raised to 8 GB on the 16 GB public Actions runner.

## 22 October 2026 — authorized account settings release

- Owner explicitly requested deployment of the prepared CSP, account settings,
  birth-date, data download and confirmed deletion changes. This supersedes the
  earlier hold before pushing. Root SSH, administrator MFA and PDF filtering stay
  outside this release, as previously agreed.
- Release branch: `codex/csp-account-settings`, verified against current main
  `544a2f1`. Local lint/typecheck/build, 685 unit tests, ten deployment-helper
  tests and dependency policy passed. CI must additionally run the isolated
  PostgreSQL/browser journey before merge; production will not substitute for it.
- Both migrations are additive. Existing account preferences are preserved;
  deployment uses the normal gated workflow and automatic worker restart. The
  preceding release remains the rollback target; these columns are compatible
  with the preceding application. No manual privileged server change is needed.
- PR #51's first browser run passed 14 journeys but hit a development manifest
  JSON read race at the privacy fixture's registration step. A fresh isolated
  rerun reached download and exposed a local-origin mismatch: Next reports
  localhost while the configured browser uses 127.0.0.1. The export route now
  accepts explicitly configured loopback origins only outside production, with
  regressions for both the mismatch and arbitrary-origin denial. The privacy
  fixture retains HTTP registration, using the endpoint warmed by suite setup.
  The independent privacy journey runs first for immediate feedback and retains
  an unrelated owner's startup as an isolation control, then removes only that
  disposable control. No product authorization or safety gate is relaxed.
- The next CI run exposed Playwright's inability to link Better Auth's ESM graph
  when importing the server auth module directly, and a dependency-service timeout.
  The independent first privacy fixture now uses the warmed HTTP endpoint; the
  account remains created and exercised through normal application authentication.
  The dependency check remains fail-closed and must pass before release.
  All privacy response, rollback, ownership and deletion assertions remain required.
- A subsequent browser runner missed the unchanged 120-second database-backed
  web readiness deadline, while the unit/dependency job passed. Startup output
  is now retained and Next launches directly from the installed dependency so
  a package-runner lookup cannot delay it. The readiness endpoint and deadline
  remain unchanged; the complete browser gate is still required before merge.
- The observable run started successfully and returned an export. Its next
  failure was reading the attachment through Chromium's response-debugging API.
  The test now reads the actual saved download, requiring successful completion,
  valid JSON and the same owner/privacy assertions before continuing to deletion.
- The saved-file assertions passed. Direct privacy-helper imports now use the
  same relative server-module paths as the existing vote-store browser checks,
  avoiding Playwright's unresolved Next-only alias during rollback verification.
- Rollback passed; the next run exposed the protected settings refresh replacing
  the post-deletion confirmation with login. Confirmed deletion now redirects
  to a public, no-index receipt before clearing stale browser auth cookies.
  Root visibility invalidation and database session revocation remain intact;
  failed transactions cannot redirect or report success. The browser must verify
  both the receipt URL and confirmation before checking dependent data and files.
- Final local build, lint/typecheck and all 687 unit tests pass (two optional
  skips). The component regression now verifies the public receipt's authoritative
  cookie refresh instead of the replaced inline sign-out flow. CI still must pass
  for the final commit before the authorized merge and production release.

## 22 October 2026 — local account download and deletion preparation

- Owner authorized adding data download and account deletion to settings.
  The earlier hold before pushing still applies. No production account is used.
- Separate emailed, hashed, purpose-bound, 15-minute proofs protect both actions;
  strict current-user/session checks, rate protection and final DELETE confirmation
  protect erasure. Staff accounts use the support handover route.
- Owner-only JSON projections omit auth secrets and other people's private data.
  Dependent account content is removed in one transaction; failures roll back.
- Additive media queue fields support bounded sync-worker erasure retries. Marked
  files are denied immediately; uploads and deletion share a lock to prevent late
  writes. Optional startup emails are suppressed once the recipient account is gone.
- Privacy copy distinguishes device/unlinked records and retained backups. No
  automatic backup expiry is promised. Root SSH, PDF filtering and 2FA are unchanged.
- Verification: 685 unit tests passed, two opt-in skipped; lint, typecheck,
  production build, ten deployment-helper tests and diff checks passed. The
  dependency policy passed with its three existing reviewed unresolved advisories
  (14 affected entries); no dependency or exception changes were made.
- Desktop/phone sample-account previews checked at 1366px and 390px with no
  horizontal overflow. The DB-backed browser journey, including real rollback,
  remains unrun because Docker's local database service is unavailable. It is a
  required release check; production was not substituted. No push, deployment,
  real confirmation email, customer deletion or production migration occurred.

## 22 October 2026 — local CSP and account settings preparation

- Owner authorized CSP, a visible change-password option and date of birth.
  **Do not push until the owner has reviewed the prepared changes.**
- Branch `codex/csp-account-settings`, based on live `544a2f1`.
- Root-level `proxy.ts` supplies matching fresh CSP/SSR nonces. Removed the
  inactive `app/proxy.ts`; authorization stays in layouts/actions. The early
  curtain script and dynamically loaded Turnstile script receive the nonce.
- Optional birth dates use validated YYYY-MM-DD text; empty means unspecified.
  An additive column migration preserves existing accounts. No public projection
  adds birth dates. Settings and privacy copy explain saving and removal.
- Settings has password/security shortcuts, existing password-change protection,
  a Google-only recovery path and explicitly labelled IST save times.
- Owner follow-up: removed the duplicate founder-mode section from settings.
  Grouped profile, private personal details and notifications in one save form;
  password, email and other devices follow in the security card. Responsive jump
  navigation makes each area directly reachable. Founder mode stays on dashboard.
  Follow-up checks: lint, typecheck, production build and 38 focused account tests
  passed. A temporary sample-account render verified all six jump destinations,
  no founder switch, and no horizontal overflow at 1366px and 390px. Private
  preview images were captured; this does not replace the unavailable DB suite.
- Read PO #373 and Grok's linked report: 21 open and 15 new reports, mostly from
  the preceding release. This batch addresses account save-time clarity; the
  wider bug backlog is triaged separately and is not represented as fixed.
  Dense leaderboard ties and the owner's dashboard-only-toggle requirement remain.
- SSH root-password policy, administrator MFA and the PDF finding are deferred
  for the owner's discussion with Arush. No server configuration changes or
  production account mutations are part of this work.
- Local verification: 625 unit tests passed, two opt-in tests skipped; lint,
  typecheck, production build and ten deployment-helper tests passed. A production
  preview verified matching fresh CSP/SSR nonces on four routes, asset exclusion,
  and working search, cookie dismissal, mobile navigation and FAQ interaction with
  no browser CSP errors. The complete DB-backed browser suite was not run locally
  because Docker's database engine was unavailable. The dependency service timed
  out; its gate correctly failed closed. No clean dependency audit is asserted.
- No push, PR creation, deployment or production migration has been performed.

## 22 October 2026 — dashboard founder-mode header control

- Owner requested the founder toggle at the top right beside the welcome heading.
- Moved the control into both dashboard greetings, showing only the switch and
  “Founder mode On/Off,” with a stacked phone layout. Removed the old dashboard
  card; profile settings retains its explanation and Undo. Saves remain automatic.
- New registrations default off through the shared auth field and unchecked signup
  opt-in. Existing saved preferences and the legacy database default are preserved.
- Branch: `codex/founder-toggle-dashboard-header`, from verified live `3920596`.
  No migrations, account-data changes, bot activity or scoring changes are needed.

## 22 October 2026 — site review deployment dependency follow-up

- PR #48 passed all gates (616 unit tests and 14 browser journeys) and was
  owner-authorized merged as `771a075`. One profile-photo save timeout passed
  unchanged on a fresh isolated browser run.
- Main's subsequent audit newly reported two `@vitest/mocker` advisories and
  stopped deployment. The public release remains `c128585` until checks pass.
- Follow-up branch `codex/site-review-vitest-security` upgrades the Vitest family
  to the compatible 4.1.12 security patch. No audit exceptions, deployment checks,
  application code, migrations or manual server configuration are changed.
- Browser runs exposed late development-server request timeouts and a logout
  assertion that began its five-second navigation deadline before sign-out
  finished. Isolated E2E config now retains compiled routes for the job duration;
  the logout test requires a successful sign-out response and the existing login
  navigation budget. Production and fixture-isolation guards remain unchanged.
- A further first-journey screenshot showed the draft save still pending when
  the default five-second assertion expired. CI assertions now use the existing
  30-second action budget; failure traces are retained on first failure, matching
  the serial suite's no-retry policy. Saved-content and DB assertions remain.

## 22 October 2026 — Claude site review release preparation

- Owner authorized reviewing, pushing and merging `claude/site-review-fixes`.
  The branch retains Claude's three original commits and their authorship.
- Reviewed the UI/navigation changes against the current main baseline `c128585`.
  Updated account documentation and the settings browser assertion to cover the
  newly available founder-mode control without changing its visibility rules.
- Release requires passing PR unit/dependency/browser gates, then the normal
  main deployment and public release/health verification. No manual server
  configuration or database migration is required by this branch.

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
