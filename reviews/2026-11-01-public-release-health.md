# Public release health check — 1 November 2026

Owner: Codex. Base: `b3bd2ef5e12f9756aa7279fecfe2e6f543fface8`.
Status: source implementation complete; local checks passed; not merged or installed.

## Current observation

Signed-out requests at **08:55 IST** returned Discover 200 and health 200 with
database connected, but `/.well-known/release.json` returned 404. This supersedes
last night's 502 availability observation; it is not verified recovery of the
intended release. The exact recovery time and the actor/change are unknown.

Read-only pinned-host inspection at **08:56 IST** found:

- nginx now points to loopback 3000 (it pointed to 3012 at last night's check).
- The web process is running from legacy `/var/www/anshkosh`, with a 3000 listener.
- `state/current.json` still names the immutable `b3bd2ef5…` release on 3012,
  expected process `anshkosh-web-3012`. No 3012 listener was observed.
- Public release JSON remains 404; public health is 200/database connected.

No routing/process/release changes were performed by this operating run. An
outside change restored page availability, but deployment-state alignment is
still unresolved. Do not undo someone else's recovery or route blindly.

## Prepared monitoring improvement

The scheduled external [uptime workflow](../.github/workflows/uptime.yml) calls
[check-public-health.mjs](../scripts/check-public-health.mjs). Its old behavior
checked only homepage HTTP success and database connectivity. An offline stub
reproduced a success message without any request to the release endpoint.

The prepared checker additionally requires release HTTP success, valid JSON, a
40-character hexadecimal commit and a parseable build timestamp. Database and
homepage failures remain failures; requests keep a 15-second timeout and no-store
cache mode. Network/parse failures report a bounded message without response
bodies or transport details. Importing the module does not contact production.

This is a missing/malformed release-identity guard. It does **not** compare the
commit with latest main or server state, prove artifact authenticity, repair
routing or change rollback policy. A deliberately retained valid release can
still pass; operator release/process alignment remains a separate check.

The existing schedule and notification behavior are unchanged in this source
proposal. No automation, root-owned monitor, publishing bot or installed job was
run, enabled, paused or edited.

## Verification

- Offline baseline: old checker reported success for healthy database/homepage
  responses, without checking the missing release endpoint.
- Node syntax check passed.
- One read-only live run of the prepared checker at 08:58 IST failed as expected:
  `Anshkosh release identity check failed: HTTP 404`.
- [Offline regressions](../__tests__/public-health.test.ts) use injected response
  fixtures only: healthy identity, reproduced missing endpoint, malformed
  identities/build dates, non-JSON responses, database/page/network failure and
  bounded request options. **27 focused tests passed** across the new public-health
  tests and existing monitor-policy tests.
- Full lint and typecheck passed. Dependency policy passed with zero policy
  failures; one already-reviewed postcss-selector-parser advisory remains
  unresolved under its existing exception. This is not a zero-advisory audit.
- Full unit suite: **839 passed, two skipped (841 total)**. Source whitespace checks and all three local review
  links passed. No browser/database journey is changed by this CLI-only patch.

## Coordination and next action

Grok request #774 carries the already-accepted outbound-link audit into today's
accessible pages, with fresh slugs/times and no contact or account actions.
Claude request #775 carries the existing source-only two-cover packet forward.
Claude ACK #776 confirms the prior packet was never written and commits to a
current 10:30 IST handoff; this is accepted/in-progress, not completion. Grok's
current ACK/result is pending. Dated evidence is requested by 21:30 IST for the
22:00 EOD.

Finish checks and open a draft review PR. Merge or production recovery still
requires the existing owner authority and required checks. The unanswered recovery
decision from last night's EOD is not silently approved by this heartbeat or by
the outside route change. OpenKnowledge remains read-only; this record belongs
to the application source project.
