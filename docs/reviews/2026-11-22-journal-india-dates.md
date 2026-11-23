# Journal India-time display correction — 22 November 2026

Owner: Codex. Branch: `codex/journal-india-dates-20261122`, based on reviewed
PR #108 head `bda9e3bc`. This delayed operating session started after the
22 November 22:00 IST EOD cutoff; results carry into the next report.
Status: initial head passed local checks and CI; independent review requested a
search-result follow-up, now prepared. Fresh full-suite/CI and re-review are
pending on the revised head. No merge or deployment.

## Defect and bounded change

The 20 November delivery audit reproduced a published Journal article displaying
19 November for timestamp `2026-11-20T03:27:18.773Z` (20 November 08:57 IST).
The date formatters set `en-IN` locale but inherit the render host's timezone.
Locale does not select India's calendar. Its old formatter returns 19 November
on an America/Denver host.

One shared formatter now explicitly uses `Asia/Kolkata` for public Journal dates:
article published/updated dates, featured-listing publication date, cards'
existing updated/published fallback, and public Journal search results.
No stored timestamp, structured UTC date,
publication/scheduling logic, database schema, content copy or activity treatment
is changed. Article JSON-LD and Open Graph timestamp serialization stay intact.

Regression coverage includes six instants on three independent host timezones:
America/Denver, UTC and Asia/Kolkata. Cases cover both sides of IST midnight,
the observed publication, the next day, year rollover and leap day. A separate
case checks the input instant is unchanged. Each child also reports its actual
host timezone, checked against the canonical requested zone. A disposable-DB
browser case covers article, featured listing, card, search and UTC structured metadata, and reads the
stored dates back. Its uniquely named future fixture wins the featured slot
without editing other records and is deleted in a finally block.

## Validation

- Fresh `npm ci` passed and generated Prisma Client 6.19.3.
- Lint and typecheck passed. The dependency gate reports zero affected entries,
  zero accepted exceptions and zero policy failures on the retained patched base.
- Seventeen focused Journal date/metadata/HTML tests passed. The new formatter
  covers six instants under each of three separate host timezones (18 boundary
  observations) and preserves the input instant.
- Full unit suite: **917 passed, two skipped**; 123 test files passed, one skipped.
- The old formatter reproduces **19 November 2026** on a Denver host for the
  observed publication; the new formatter gives **20 November 2026**.
- Playwright discovers the new public browser test with synthetic isolated
  configuration. The initial unconfigured discovery refused to run, as intended
  by its database guard. No local database or browser server was started.
- Diff whitespace checks pass. Node is 22.23.2. No dependency versions or lock
  records differ from the reviewed base.

The above completed checks describe initial head `3af7a723`. Its CI run
45052512390 subsequently passed, including all browser groups and the new date
case. That success does not cover the search follow-up below.

## Dependency and ownership

The session continued on 23 November in the client calendar. Claude #1254
requested the additional public Journal date on `/search`; that consumer and
the browser search assertion were added. The tests now verify actual child
host timezones as well as formatted dates. The earlier head's local/CI results
do not cover this follow-up; fresh checks and exact-head re-review are required.

Fresh follow-up checks: lint and typecheck passed, and all four strengthened
date tests passed. The first full-suite attempt had 916 passes, two skips and
one failure: the unchanged Effect security test's child process exceeded its
five-second limit while lint was also running. That exact security test passed
in isolation afterward (about 2.4 seconds), without a code or timeout change.
A full-suite rerun without concurrent lint and the new exact-head CI are pending.
No failure is hidden or accepted as a policy exception. The date review scope
now touches nine files from `bda9e3bc`; the Effect test is unchanged.

The date change retains PR #108's reviewed dependency patches unchanged. CI is
configured only for main-target PRs, so this dependent draft targets main and
must wait for #108 first; the new review scope is `bda9e3bc..date-head`. No main
merge, deployment or workflow/gate change is authorized. The normal source
guidance prefers latest main; this dependent branch descends from that main and
adds the already-reviewed, still-unmerged prerequisite rather than recreating it.

Codex owns checks and the app handoff. Claude's CL-B1FB2A read-only receipt task
is separate; its result arrived in #1249 after cutoff and is not a date-fix
review. An exact app review request follows validation. Grok's existing
concurrency handoff remains requested in #1237; no result or fresh commitment
is inferred. Evidence is due by 23 November 21:30 for the separate 22:00 EOD.

OpenKnowledge remains read-only. This source review replaces no wiki document;
the wiki-update step in older repository guidance is superseded by the current
owner pause. No publisher, bot, account, production or schedule action is performed.
