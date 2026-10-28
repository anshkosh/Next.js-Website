# Local deepmerge security patch

This directory vendors the MIT-licensed `deepmerge` 4.3.1 package with a local
security patch and package version `4.3.2`. It is installed through the root
`overrides` entry so transitive consumers such as `html-to-text` and `shadcn`
receive the patched implementation.

The patch skips `__proto__`, `constructor`, and `prototype` keys when copying or
merging objects, and defines output properties with `Object.defineProperty` so
the legacy `__proto__` setter cannot run. It applies to the CommonJS and UMD
builds as well as the source entry.

Upstream reference: `GHSA-gcqx-w48m-w2h4` / `CVE-2026-93753`.
Reconcile this fork with an upstream patched release before removing the
override. Keep the upstream license and attribution with the vendored files.
