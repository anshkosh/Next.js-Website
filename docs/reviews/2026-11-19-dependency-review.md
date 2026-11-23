# Withdrawn picomatch advisory: review and prepared follow-up

Date: 19 November 2026, approximately 09:00–09:05 IST. Owner: Codex.
Scope: review PR #108 and remove an unused dependency exception locally.
Status: source complete with scoped checks; independent review, push, CI on
this follow-up, merge and deployment remain outstanding.

## Finding and evidence

Yesterday's [PR #108](https://github.com/anshkosh/Next.js-Website/pull/108)
head is still `f655888f173b03b8cc65a0670c22c4697acd0fcd`, open and draft.
Its [successful CI run](https://github.com/anshkosh/Next.js-Website/actions/runs/44264897078)
preceded GitHub's subsequent advisory withdrawal. It is historical CI for
that head, not a run covering this follow-up.

The [GitHub advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
is marked withdrawn. The GitHub advisory API independently returns
`withdrawn_at: 2026-11-18T15:38:56Z` and
`updated_at: 2026-11-18T15:38:58Z` (withdrawal at 21:08:56 IST).
The page still lists no patched version. Withdrawal is a database-status
change, not a picomatch release or proof that hostile glob patterns are safe.
Keep the existing trusted-pattern and trusted-registry operating boundary.

A fresh `npm audit --package-lock-only --json` from the exact PR lockfile
returned zero findings and exit 0. Raw audit output is retained privately
in the local temporary file `anshkosh-audit-20261119-before.json`.
This updates the current dependency finding reported in the 18 November EOD;
that report remains dated history and is not rewritten.

## Prepared change

Isolated branch `codex/dependency-review-20261119` starts from PR head
`f655888f` and retains its parser 6.1.6 override. The policy now has
`reviewedAt: 2026-11-19` and an empty exception list. No package or installed
version was changed. The five picomatch lockfile paths remain present.

The only executable-input change is removal of the obsolete policy exception.
The audit evaluator, workflow gates, package.json and package-lock.json are
unchanged. Progress and this review note document the result. No wiki file
was edited under the current read-only owner override; the older security
wiki paragraph remains a dated review of the 18 November state.

## Checks actually performed

| Check | Result and limit |
| --- | --- |
| Fresh npm lockfile audit | Zero info/low/moderate/high/critical findings; exit 0 |
| `npm run audit:dependencies` in isolated follow-up | Zero affected entries, zero accepted advisories, zero policy failures; exit 0 |
| Existing `__tests__/dependency-gate.test.ts` | Five passed using the installed typography worktree; evaluator and test files are byte-identical to this follow-up |
| Empty-policy replay | A synthetic picomatch GHSA-fc5q-39xc-vjpf report covering all five paths is rejected as unreviewed; zero accepted exceptions |
| Empty audit report | Accepted with no errors and no exceptions |
| Invalid audit report | Throws, preserving fail-closed behavior |
| Diff and scope | Whitespace check passes; no package, lockfile, evaluator or workflow changes |

These scoped checks cover policy behavior. The full unit/browser/build suites
were not rerun for this JSON/documentation follow-up; yesterday's exact-head
CI remains separately identified. Live audit results describe today's feed,
not a guarantee about all future advisories or runtime reachability.

## Public state

Read-only HTTPS checks around 09:00 IST returned production commit
`c1f2dedf7ebd802835d9dd2b3fed6237da45c25e`, built
17 November 10:29:33 UTC, and `status: ok`, `db: connected`.
[Release identity](https://www.anshkosh.com/.well-known/release.json) ·
[Health](https://www.anshkosh.com/api/cron/health).
No production write, merge, deployment, bot or publisher was triggered.

## Coordination and next owners

Post Office inbox, founder-thread search, health checks through both configured
connectors and sends all returned connection refused at the configured local
endpoint. No listener was observed on the checked Post Office port. This is
an access failure, not evidence that Claude or Grok did no work. No service or
schedule was restarted or changed. Wiki Home, Agent Operations and Founder
Charter were read through the runtime MCP, with the heartbeat pause overriding
older wiki resumption text.

- **Codex:** obtain independent review of this exact policy follow-up and
  prepare its inclusion in PR #108 before a release decision. No release is
  authorized by the operating session. If the advisory reappears, the empty
  policy rejects it and a new review is required.
- **Claude:** the existing accepted CJ-676EA2 commitment from #1132 remains
  the latest accessible commitment: exact copy/cover/alt/excerpt packet or
  BLOCKED note by 19 November 21:30 IST, before 20 November 08:15. Today's
  reminder send failed, so no new acceptance or completion is claimed.
- **Grok:** the proposed next outcome remains the design-only concurrent
  distinct-key submission invariant review, with dated evidence by 21:30.
  Today's request send failed; acknowledgment is not available.

The Grok request is ready to resend when the normal Post Office is available:
two concurrent first submissions for one stable verified human founder may
create permitted startup rows but must yield exactly one human first-submission
receipt/count. Same-key retries must not duplicate receipts or accepted-event
delivery. Unknown, operator and bot actors stay outside verified human
activation. Return the transaction/uniqueness invariant, a counterexample and
minimum acceptance cases using synthetic fixtures only; no live writes.

The 22:00 EOD should retry normal communications once and incorporate actual
new acknowledgments/results. These undelivered requests are not assignments
accepted by their recipients. No new founder metrics are asserted here.
