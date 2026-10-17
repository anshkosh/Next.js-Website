# Founder Journal and dashboard tools

Founders open their journal at `/dashboard/journal` or from the dashboard and founder navigation. The writing area uses the same shared Quill editor as the admin Journal, including headings, bold/italic/underline/strike, lists, quotations, code blocks, links, images and video. Entries support free writing, progress/challenge/lesson prompts, a weekly review, and one optional milestone with a completion checkbox. Prompts are optional and adding one preserves existing formatting. Private entries do not require a startup. Existing plain-text entries open in the rich editor without a destructive conversion.

## Visibility and ownership

- New entries default to `PRIVATE` in the database, server validation, and editor. They are account-backed; unsaved text is not written to browser storage.
- Every owner read and mutation is scoped to the current authenticated user's ID. Saving and deleting require an email-verified, unbanned account. There is no administrator read/edit shortcut.
- `PUBLIC` requires a selected startup belonging to that founder with status `LIVE`. The editor names the startup before saving and offers a preview. The optional milestone is public along with the entry.
- The startup detail page displays public entries under **Founder Journal**, separate from existing Founder Updates and editorial Journal articles. Public queries filter by visibility, live startup, and matching founder, and use a separate field projection. Private entries never enter the public component payload, including when the viewer is their author.
- Returning an entry to private clears its publication timestamp and invalidates both the owner views and affected startup pages. Previous readers may retain their own copies; withdrawing an entry cannot revoke those copies.
- Entries attached to a suspended or non-live startup do not appear publicly. Deleting a startup detaches its entries rather than deleting the founder's journal. Public queries exclude detached entries.
- Owner pages show 20 entries at a time; public startup pages show 10 with older/newer navigation. Rich content is stored as validated Quill Delta JSON and rendered as React elements from an allowlist. Client-supplied HTML is ignored. A plain-text summary is derived on the server. Links and video sources are restricted to safe protocols/providers.
- Founder images use a separate authenticated upload endpoint with existing rate/size/quota protections and image decoding/re-encoding. Only owned registered uploads can be attached. Images are served through an owner/public-entry access check with `private, no-store` on every response, including public images, so withdrawing an entry revokes subsequent anonymous image requests. The admin Journal's existing public-image endpoint is not used for founder drafts. Saving or switching entries is blocked while an upload is pending.

Each startup card has compact Journal and “Tools to build and launch” buttons. On live startup cards, Journal sits alongside Updates and Discussion, below View Page and Edit; the tools button spans the card above these actions. The tools button replaces “Open free launch kit” and opens the full toolkit catalogue. The same resources are available in the no-startups state; there are no separate journal or tools promotional cards. Existing tools retain their current browser-local draft behavior.

## Database and release

Apply the additive `20261016160000_founder_journal` and `20261017120000_founder_journal_rich_text` Prisma migrations before starting the new code. They create the founder journal table and add nullable Delta JSON and media-reference fields/indexes; they do not alter existing startup updates or editorial posts. Generate the Prisma client during installation/build.

This feature has been built and tested locally; it is not a production deployment. The production comment-Turnstile pause and Google OAuth replacement from 16 October are separate runtime/release changes. Preserve them when preparing a release and check the active production marker and environment rather than deploying an older local baseline wholesale.

Code rollback can use the previous release while retaining the new table and user entries. Do not drop the table as a routine rollback; that would destroy journal data.

## Validation

- Latest full suite after rich-editor integration: 334 tests passed; the separate opt-in database case is skipped in the default run and passed separately against disposable PostgreSQL.
- Editor coverage includes private defaults/reset, retained text on save failure, explicit startup choice for publication, and non-destructive weekly prompts.
- Prisma validation, TypeScript, changed-file ESLint and optimized Next.js build passed.
- Migration applied successfully to local disposable PostgreSQL database `anshkosh_e2e`. An opt-in real-database test passed for private creation, publication, cross-owner denial, suspension/owner-change exclusion, withdrawal and deletion.
- Actual local browser flow: password login, dashboard cards, private entry with completed milestone, public preview/publication on selected startup, and return to private. Anonymous HTTP responses contained neither the private title nor body before publication or after withdrawal. The journal was visually checked in a 390-pixel-wide frame.
- The rich-editor update additionally passes real Quill component tests for its full toolbar, Strict Mode mounting, formatted rehydration, entry switching/reset, current callbacks and read-only state. Rich rendering, unsafe content, owned image uploads, anonymous media denial and image-access revocation have focused coverage. The latest rich-editor view needs a fresh browser review; the earlier manual browser flow predates that update.

Run focused unit/component checks with:

```sh
npx vitest run __tests__/founder-journal-actions.test.ts __tests__/founder-journal-privacy.test.tsx __tests__/founder-journal-editor.test.tsx
```

The real-database test is opt-in (`JOURNAL_DATABASE_TEST=1`) and refuses anything except a loopback `DATABASE_URL` ending in `/anshkosh_e2e`. Apply migrations to that disposable database first, then run `__tests__/founder-journal-database.test.ts`. The test creates its own users and startups, exercises real writes and public queries, and removes only its own fixture records.
