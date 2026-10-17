# Founder Journal and dashboard tools

Founders open their journal at `/dashboard/journal` or from the dashboard and founder navigation. Entries support free writing, progress/challenge/lesson prompts, a weekly review, and one optional milestone with a completion checkbox. Prompts are optional and adding one preserves existing text. Private entries do not require a startup.

## Visibility and ownership

- New entries default to `PRIVATE` in the database, server validation, and editor. They are account-backed; unsaved text is not written to browser storage.
- Every owner read and mutation is scoped to the current authenticated user's ID. Saving and deleting require an email-verified, unbanned account. There is no administrator read/edit shortcut.
- `PUBLIC` requires a selected startup belonging to that founder with status `LIVE`. The editor names the startup before saving and offers a preview. The optional milestone is public along with the entry.
- The startup detail page displays public entries under **Founder Journal**, separate from existing Founder Updates and editorial Journal articles. Public queries filter by visibility, live startup, and matching founder, and use a separate field projection. Private entries never enter the public component payload, including when the viewer is their author.
- Returning an entry to private clears its publication timestamp and invalidates both the owner views and affected startup pages. Previous readers may retain their own copies; withdrawing an entry cannot revoke those copies.
- Entries attached to a suspended or non-live startup do not appear publicly. Deleting a startup detaches its entries rather than deleting the founder's journal. Public queries exclude detached entries.
- Owner pages show 20 entries at a time; public startup pages show 10 with older/newer navigation. Entry bodies are plain text rendered through React escaping, not supplied HTML.

Each startup card has compact Journal and “Explore all 9 free tools” buttons. On live startup cards, Journal sits alongside Updates and Discussion, below View Page and Edit; the tools button spans the card above these actions. The tools button replaces “Open free launch kit” and opens the full toolkit catalogue. The same resources are available in the no-startups state; there are no separate journal or tools promotional cards. Existing tools retain their current browser-local draft behavior.

## Database and release

Apply the additive `20261016160000_founder_journal` Prisma migration before starting the new code. It creates only the `FounderEntryVisibility` enum and `FounderJournalEntry` table/indexes/foreign keys; it does not alter existing startup updates or editorial posts. Generate the Prisma client during installation/build.

This feature has been built and tested locally; it is not a production deployment. The production comment-Turnstile pause and Google OAuth replacement from 16 October are separate runtime/release changes. Preserve them when preparing a release and check the active production marker and environment rather than deploying an older local baseline wholesale.

Code rollback can use the previous release while retaining the new table and user entries. Do not drop the table as a routine rollback; that would destroy journal data.

## Validation

- Final full suite: 309 tests passed; the separate opt-in database case is skipped in the default run. All 28 focused unit/component cases passed together.
- Editor coverage includes private defaults/reset, retained text on save failure, explicit startup choice for publication, and non-destructive weekly prompts.
- Prisma validation, TypeScript, changed-file ESLint and optimized Next.js build passed.
- Migration applied successfully to local disposable PostgreSQL database `anshkosh_e2e`. An opt-in real-database test passed for private creation, publication, cross-owner denial, suspension/owner-change exclusion, withdrawal and deletion.
- Actual local browser flow: password login, dashboard cards, private entry with completed milestone, public preview/publication on selected startup, and return to private. Anonymous HTTP responses contained neither the private title nor body before publication or after withdrawal. The journal was visually checked in a 390-pixel-wide frame.

Run focused unit/component checks with:

```sh
npx vitest run __tests__/founder-journal-actions.test.ts __tests__/founder-journal-privacy.test.tsx __tests__/founder-journal-editor.test.tsx
```

The real-database test is opt-in (`JOURNAL_DATABASE_TEST=1`) and refuses anything except a loopback `DATABASE_URL` ending in `/anshkosh_e2e`. Apply migrations to that disposable database first, then run `__tests__/founder-journal-database.test.ts`. The test creates its own users and startups, exercises real writes and public queries, and removes only its own fixture records.
