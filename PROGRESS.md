# Progress

## 27 October 2026 — pilot website copy review (prepared)

- Compared the live home, Discover and leaderboard pages with the current application copy and published pilot behavior. The homepage still called a working pilot "under construction"; repeated "before launch" messaging did not fit already-operating businesses; leaderboard copy described a mixed activity score as community interest.
- Updated the site's positioning to cover Indian startups at different stages, clarified the capped ranking components and their limits, and corrected stale fallback, metadata, footer, product documentation, and `llms.txt` descriptions.
- Source changes are based on current main `9b86f124` and are in open draft PR #66; no public release occurred. A prior local full-suite run ran 802 tests: 797 passed, 2 skipped, and 3 failed in unchanged migration-policy assertions (`__tests__/deployment-policy.test.ts`, for beta-tester and AI-moderation migration approvals). The current copy follow-up has not been run locally. GitHub Actions run `40517873155` on prior head `b605fc7a` passed test and browser jobs; deploy was skipped. That run does not cover this follow-up. No bot, account, ranking treatment, or VPS setting was changed.

## 27 October 2026 — founder signup continuity (prepared)

- Grok's signed-out founder-path report found `/startup/new` redirects to login, but “Register here” drops the validated `next` destination; the register form also leaves founder mode off and signup lacks a callback URL. Independent signed-out GETs confirmed the 307, `/register` link, and unchecked founder-mode input.
- Prepared a scoped fix that carries safe local paths through email registration/verification, selects founder mode only when the visitor explicitly starts from `/startup/new`, and explains that choice. Other registration paths stay off by default. No existing account, public profile, or auth setting was changed.
- Based on current main `9b86f124` in a separate worktree. Lint, typecheck, and dependency policy passed; focused signup regressions passed (9/9). Full unit suite: 797 passed, 2 skipped, 3 existing failures in `deployment-policy.test.ts` for reviewed migration approvals. Browser regression is included for isolated CI. No account, public profile, bot, or production state was changed.
- PR #68 remains a draft; no production merge or deployment has occurred. The current-main refresh is prepared as a separate branch update, with CI expected to rerun after push.

## 26 October 2026 — release 404 guard correction

- Owner approved merge/deployment of PR #64, merged as `e27abe61`. Main's code,
  database and browser gates passed and the candidate built/started successfully.
- The pre-switch SEO gate caught `/journal/seo-check-nonexistent-article`
  returning HTTP 200: the new ancestor `journal/loading.tsx` flushed headers
  before `notFound()`. The candidate was stopped; public traffic stayed on
  healthy `c29766ce` and the earlier HTTP/2 server improvement remains active.
- Remove only the journal ancestor loading boundary. Keep the other skeletons
  and preserve the strict production 404 check. Extend the first isolated browser
  journey with actual missing article/startup/category/root HTTP responses for
  ordinary and crawler user agents, requiring 404 and noindex before publication.
- Follow-up branch `codex/loading-speed-404` starts from merged main. Existing
  owner authorization covers this release repair and subsequent normal deployment
  after all checks pass; no new migration, account/content or scoring changes.

## 26 October 2026 — loading-speed fixes (prepared)

- Branch `codex/loading-speed` starts from deployed main `c29766ce` in a separate
  managed worktree. Existing maintenance-checkout changes are preserved.
- Added public-only Redis signal caching keyed by the current PostgreSQL snapshot
  and bounded by scheduled changes; request deduplication and five-row homepage
  selection reduce repeated reads. Visitor state and nonce-bearing HTML remain
  private, and scoring/eligibility rules and existing activity are unchanged.
- Added public-list skeletons, streamed home rankings, deferred mascot code,
  high-priority quality-75 hero delivery, three-at-a-time server-rendered update
  paging, shared metadata/profile reads and a short public category-label cache.
- Removed the redundant uuid types stub and added post-release/manual Lighthouse
  reports. A manual HTTP/2 helper is prepared with lock/backup/validation/rollback;
  no live server, DNS, bot, account or pool configuration was changed.
- Local production build, lint/typecheck, dependency policy, 797 full-suite tests
  and 12 deployment-helper tests passed. Subsequent focused category-cache and
  cache-recovery tests also pass; two existing optional tests remain skipped.
- At 1080px the hero's local WebP encoding fell from 84,178 to 53,090 bytes (37%)
  using quality 75. This is a byte-size comparison, not a measured live LCP gain.
- Local Docker remains unavailable after startup was requested. The preview
  launch was blocked by automatic approval review (reason: blocked by policy).
  Real PostgreSQL and full browser checks will run in the required isolated CI.
- Draft PR #64 contains source commit `ce37be07`. Required workflow `40278940058`
  did not start either code or browser job: both GitHub annotations report failed
  account payments or a spending-limit block. No CI test failure or pass is claimed.
  Restore Actions access, rerun all required checks and resolve any findings before
  approving merge/deployment. Release remains `c29766ce`; no deploy was attempted.
- The documented maintenance SSH login was rejected during the audit. HTTP/2
  activation, front-site CDN setup and live pool/index verification remain external
  follow-ups. The prepared HTTP/2 helper has 12 passing deployment-helper tests
  across the helper suite, but has not been applied to the server.

### Follow-up verification and HTTP/2 activation

- The repository is public. A fresh run `40279263644` started both required jobs
  successfully; code checks and all PostgreSQL checks, including the new cache
  concurrency/scheduling regression, passed. Its full browser suite is running.
  The earlier account-billing rejection is no longer blocking job startup.
- The operations guide identifies the maintenance key as administrator access,
  not deploy access. That documented account works. Read-only live inventory
  confirmed the expected indexes, Prisma default pool settings, 100 maximum
  PostgreSQL connections and nine idle plus one diagnostic active connection.
- Enabled HTTP/2 under the deployment lock after a config backup and successful
  `nginx -t`; backup `nginx-http2-20261026T062550519644.conf`. The helper first
  stopped before changes on Python 3.6; the corrected helper and 14 Python tests
  now cover legacy-runtime activation and rollback. No TLS cipher/protocol
  policy, route, upload limit, application release or worker was changed.
- External ALPN and all 31 Chrome requests verified `h2`; public pages/health
  passed and release stayed `c29766ce`. Fresh mobile home: 90/100, LCP 3.2 s,
  blocking 80 ms, no run warnings. Earlier home: 78/100, LCP 4.7 s. These are
  single lab observations, not a causal or real-user performance guarantee.
- App changes still need completed passing checks and owner-approved merge.
  CDN/DNS changes and additional capacity remain outside this code release.

## 24 October 2026 — moderation controls (in progress)

- Add searchable, paginated comment controls for pending, published and hidden/rejected comments; staff can restore or hide comments and see the latest AI review reasons.
- Add reasoned, expiring account bans from comments linked at submission to a verified account. Admins and reviewers can ban ordinary users; staff accounts are protected, and reviewers gain no general user/session-management API access.
- Add keyed-hash comment-only email blocks for verified identities, an active restrictions page with unblock/revoke controls, and session revocation on account bans.
- Anonymous unverified email addresses are not ban targets; blunt product criticism remains reviewable and publishable.
- Additive schema work also clears linked commenter identity and restrictions during account erasure. Implementation and release gates still in progress.

## 24 October 2026 — physical threat moderation follow-up

- Grok's authorized MODTEST-R2 report found one false negative on deployed
  `b8f765e6`: a non-profane threat to show up and smash a test booth's register
  table passed automatic review. The report says Kosh later hid it; an independent
  public page check confirmed the threat text and blunt product examples are no
  longer visible.
- Add a conservative pattern for explicit threats to arrive at a place and damage
  property, with regressions through compose warning, AI-safe verdict override,
  and disposable PostgreSQL worker publication. Keep blunt product criticism
  eligible for auto-publication. CI and release checks pending.

## 24 October 2026 — comment abuse safety follow-up

- The WardDesk test showed that Llama Guard marked an obvious personal attack
  safe and it was published. Owner clarified that blunt product criticism should
  remain publishable; safe comments keep automatic publication.
- Hold possible threats, attacks on people and profanity even if AI says safe.
  Add shared warning text while composing and after saving flagged language for
  review. Product-directed “sucks”, “useless”, “trash” and “garbage” alone do not
  flag feedback. These patterns are review aids, not a complete abuse classifier.
- Existing published comments, bot activity and ranking treatment are unchanged.
- Branch `codex/comment-abuse-gate` starts from deployed `main` `1d18b8f` in the
  clean AI moderation worktree. Compatible lockfile updates cleared newly
  reported dependency gate failures without new exceptions. Local full unit
  suite, targeted English/Hindi/Hinglish language and warning tests, lint,
  typecheck and dependency policy pass. PR #58 tracks CI and release; owner
  authorized merge and VPS deployment after required checks pass.

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

## 27 October 2026 — follow-up content fixes from live review

- Verified Claude’s read-only findings against the current app code and live page output. The leaderboard main value already shows total signals (e.g. 12 = 7 net votes + 5 activity), so the claim that it ranks on a different headline number is not supported; preserve the existing layout.
- Clarified the actual scoring maxima: founder publishing up to 20 points (10 days), approved participants up to 40 points (20 people), and replied participants up to 30 points (10 people). Explained dense tie ranks, changed “discussions/comments” wording to participants with replies, clarified future offers are not current preorders, and made Discover’s “more” count include the total published directory.
- Updated FAQ, leaderboard, homepage ranking description, Discover count, and the matching product/SEO notes. Changes remain in draft PR #66; no release or public interaction was made. No tests were run for this copy-only follow-up.

## 27 October 2026 — clear next-step paths and support status

- Added a direct “Explore free tools” action to the homepage closing CTA, which previously mentioned a free tool but linked only to Discover and startup submission.
- Reworked the Launch Support planned-services block to distinguish future permission-based directory-submission help from the catalogue and tracker available today; removed the repeated SEO/backlink pitch while retaining a clear no-guarantee statement.
- The preorder FAQ now describes votes and messages as opinions, not commitments. These changes are local in the PR #66 worktree and have not been tested; no public release occurred.

## 27 October 2026 — third-party listing strip review

- Inspected the linked directory pages from the live homepage. Product Hunt and Crunchbase still say crowdfunding is coming soon; TechBase still frames Anshkosh as pre-launch and describes future crowdfunding; LaunchFree explicitly says the site is under construction. The Free Startup Listing link points to its directory homepage, with no Anshkosh profile visible. AppRater has a public Anshkosh profile that describes the current early-access discovery product.
- Updated `lib/featured-listings.ts` and `components/landing/LandingFeaturedOn.tsx`: keep AppRater as a plain “Directory profile,” explain that the listing is independent and not an endorsement, and remove stale/unverified links and the duplicated moving marquee.
- No external listing edits. No tests or deployment. PR #66 remains draft; `git diff --check` is the source formatting check.

## 27 October 2026 — align existing assertions with approved copy changes

- The automatic PR #66 CI run for `b1257d3e` reported failures because existing assertions still required the removed discussion label, the earlier backlink wording, and the six-card animated directory strip. The new directory behavior is intentional and supported by current public-page checks.
- Updated those existing assertions to describe the current copy and single independent AppRater profile. No new tests were added, and no tests were run locally. The in-progress browser job was started against the prior head and its result remains separate from the next revision.

## Browser CI follow-up — 27 October 2026, 19:54 IST

The automatic CI unit-test job passed on `81106d98`, but the browser job failed in `e2e/launch.spec.ts:516` because it still expected `Founder–community discussions: 1 · 3 points`. Playwright passed 9 tests and stopped after this first failure, leaving 9 unrun. The assertion is now updated to the current public label, `Participants with founder replies: 1 · 3 points`. No tests were run locally; the pushed revision will get a fresh automatic CI run. The deployment job was skipped for the pull-request event.
## 28 October 2026 — owner-reviewed public layout release

- Homepage: owner-approved “Back the next thing. Before it launches.” hero and supporting copy, primary listing action, featured startup carousel, restored external profile strip, first FAQ question, and revised closing CTA. Desktop artwork now spans the hero width without changing its proportions.
- Removed the welcome curtain, early-access banner, top progress strip, homepage search and decorative heading pills. Shared page introductions align Discover, Leaderboard, Launch Support, Journal, FAQ and Contact. Header/footer branding aligns; navigation consistently changes at 1024px.
- Preserved functional filters, ranking logic, founder submission/auth return paths and moderation. No dependency, schema, bot or founder-data changes.
- Local checks: lint/type checks, dependency policy and 14 deployment-helper tests pass. Initial unit run had 789 passing, two skipped, and six failures; corrected obsolete layout/copy assertions and restored local LF migration bytes for exact-hash checks. The four affected files then pass all 34 tests. No migration content change is included. Desktop/mobile browser checks cover heading alignment, navigation, homepage search removal and full-width artwork; the existing two artwork tests pass.
- Owner requested deployment. GitHub PR checks, main deployment and public release verification remain required before reporting this release live.
