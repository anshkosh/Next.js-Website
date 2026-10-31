# Startup website URL validation — 31 October 2026

Owner: Codex. Base: `23100dd84b38bcb500bd54ebb15f8840796fc9fc` (`origin/main`).
Branch: `codex/startup-website-url-validation-20261031`.
Status: isolated implementation prepared; release blocked by dependency gate;
not deployed.

Review: [draft PR #82](https://github.com/anshkosh/Next.js-Website/pull/82),
implementation commit `63dc2d499689094de800da692fc6b5ced8b56e70`.
Its [required CI run](https://github.com/anshkosh/Next.js-Website/actions/runs/41168938651)
was in progress at handoff; no browser pass is claimed.

## Problem and reproduction

Grok's [30 October CLARRX brief](https://docs.google.com/document/d/1jy-P9aYJmS7Ni_ImecA7TvRKhOLxLTCN7u4uC4KAu-o/edit)
reported a malformed public website link. Codex reproduced it on 30 October and
again on **31 October at 09:56 IST**, using signed-out HTTP GETs only:

- [CLARRX profile](https://www.anshkosh.com/startups/clarrx) returns 200.
- Its raw outbound href is `Website: https://www.clarrx.com`.
- Resolving that malformed href against the startup page redirects to an Anshkosh
  path ending `Website:%20https:/www.clarrx.com`, which returns 404.

The shared startup schema checked URL syntax, which accepts custom schemes such
as `Website:`, `javascript:` and `mailto:`. Both the founder forms and create/edit
server actions consume this schema. This is a reproduced validation gap; it does
not establish who entered the stored value or how it reached production.

## Prepared behavior

[The startup schema](../lib/validators/startup.schema.ts) now trims surrounding
whitespace and requires a complete `http://` or `https://` website address in
addition to the existing URL syntax check. Invalid schemes and pasted labels
return a field error. Creation and editing share this rule; omitted website
fields remain allowed in partial edits. Valid live-profile edits continue through
the existing revision/moderation workflow.

No production record is corrected by this implementation. The existing CLARRX
link remains broken until a separately authorized founder/admin data correction.
This change does not silently guess a URL, migrate historical data, change public
link rendering, contact the founder, or alter social/publishing jobs.

## Verification

- Before the code fix, the new schema regression reproduced seven failures,
  including the exact reported label, active/custom schemes and incomplete HTTPS.
- After the fix, 29 focused tests passed across startup schema, edit action and
  wizard regressions. Action checks reject the label before startup lookup/write;
  a valid trimmed edit is staged without changing the published profile.
- [Browser regression](../e2e/launch.spec.ts) extends the existing isolated
  founder journey: reject the label on step 2, retain the saved database value,
  then accept the corrected address. Execution pending the isolated CI gate.
- Full lint and typecheck passed. Full local unit suite: **814 passed, 2 skipped,
  1 failed (817 total)**. The unchanged deployment-policy test at line 46 converts
  an already-CRLF migration into CRCRLF. Read-only comparison confirms the normal
  checked-out CRLF and normalized-LF-to-CRLF forms pass the migration guard; only
  that test's double conversion fails. Its test, policy and migration files match
  `origin/main`. No policy bypass or unrelated repair is included.
- Dependency policy **failed**: unreviewed `minimatch` advisory
  [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
  The gate reported 21 affected package entries and one existing narrowly reviewed
  advisory (`postcss-selector-parser`); this is not a clean dependency audit.
  Package manifests, lockfile and exception policy are unchanged from `origin/main`.
  The installed lockfile marks all three `minimatch` entries as development-only
  (versions 3.1.5 and 10.2.6, reached through ESLint and shadcn tooling). This is
  not evidence of a production exploit or incident; the release policy still fails.
  No dependency upgrade or exception is bundled into this URL fix. Triage the
  dependency finding separately before release; never bypass the gate.

## Next action and boundaries

Finish the required CI checks and triage the dependency gate. Merge/deployment requires Rinu's current
authorization and passing required checks. Production data correction is a
separate decision. Grok request #754 proposes a current signed-out outbound-link
audit; no acceptance or completion is inferred until evidence arrives. Claude
request #753 is a separate source-only two-cover readiness packet, preserving
his reported runtime access limitation. Request dated evidence by 21:30 IST for
the 22:00 EOD. OpenKnowledge remains read-only under Rinu's 27 October override;
this record is in the owning application source repository.
