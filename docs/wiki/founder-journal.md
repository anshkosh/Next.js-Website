# Founder Journal and dashboard tools

Founders open their journal at `/dashboard/journal` or from the dashboard and founder navigation. The writing area uses the same shared Quill editor as the admin Journal, including headings, bold/italic/underline/strike, lists, quotations, code blocks, links, images and video. Entries support free writing, progress/challenge/lesson prompts, a weekly review, and one optional milestone with a completion checkbox. Prompts are optional and adding one preserves existing formatting. Private entries do not require a startup. Existing plain-text entries open in the rich editor without a destructive conversion.

Validation errors identify the field without including private submitted values.
Pasted standard heading levels are supported; an H1 inside an entry renders as H2
so the page keeps one title. The editor submits a schema-parsed plain payload,
keeps text after failures and never reports a committed write as failed merely
because a cache refresh is unavailable. Founder Updates show an explicit success
notice, and `/logout` completes Better Auth sign-out with retry on failure.

## Visibility and ownership

- New entries default to `PRIVATE` in the database, server validation, and editor. They are account-backed; unsaved text is not written to browser storage.
- Every owner read and mutation is scoped to the current authenticated user's ID. Saving and deleting require an email-verified, unbanned account. There is no administrator read/edit shortcut for private entries; reviewers only receive actively submitted public revisions.
- `PUBLIC` requires a selected startup belonging to that founder with status `LIVE`. Saving submits a revision for review; it does not immediately publish. The optional milestone is public along with the approved entry.
- The startup detail page displays public entries under **Founder Journal**, separate from existing Founder Updates and editorial Journal articles. Public queries filter by visibility, live startup, and matching founder, and use a separate field projection. Private entries never enter the public component payload, including when the viewer is their author.
- Returning an entry to private clears its publication timestamp and invalidates both the owner views and affected startup pages. Previous readers may retain their own copies; withdrawing an entry cannot revoke those copies.
- Entries attached to a suspended or non-live startup do not appear publicly. Deleting a startup detaches its entries rather than deleting the founder's journal. Public queries exclude detached entries.
- Owner pages show 20 entries at a time; public startup pages show 10 with older/newer navigation. Rich content is stored as validated Quill Delta JSON and rendered as React elements from an allowlist. Client-supplied HTML is ignored. A plain-text summary is derived on the server. Links and video sources are restricted to safe protocols/providers.
- Founder images use a separate authenticated upload endpoint with existing rate/size/quota protections and image decoding/re-encoding. Only owned registered uploads can be attached. Images are served through an owner/public-entry access check with `private, no-store` on every response, including public images, so withdrawing an entry revokes subsequent anonymous image requests. The admin Journal's existing public-image endpoint is not used for founder drafts. Saving or switching entries is blocked while an upload is pending.

Each startup card has compact Journal and “Tools to build and launch” buttons. On live startup cards, Journal sits alongside Updates and Discussion, below View Page and Edit; the tools button spans the card above these actions. The tools button replaces “Open free launch kit” and opens the full toolkit catalogue. The same resources are available in the no-startups state; there are no separate journal or tools promotional cards. Existing tools retain their current browser-local draft behavior.

## Public entry pages and search

Each public entry has a canonical `/founder-journal/{id}/{title-slug}` URL, reachable from its startup page and the owner's journal. The owner can open or copy the public link. Titles determine readable slugs; old title slugs redirect to the current canonical only after publication and ownership checks pass. Private entries have no public preview route, even for their author or an administrator.

Pages include the entry title, a generated description, public founder attribution, publication/update dates, BlogPosting structured data, Open Graph/Twitter article metadata and the existing Anshkosh social image. Links lead back to the startup profile and its website. Founder-submitted outgoing links are attributed with `rel="ugc noopener noreferrer"`. Search visibility and ranking are not guaranteed.

Public queries require explicit publication, a live attached startup and matching ownership. Missing/private/deleted/non-live/mismatched entries return 404 before metadata or redirects reveal their contents. Pages are rendered fresh per request. The sitemap is also dynamic and includes only public matching-owner entries, so withdrawal does not leave cached entry titles or links in it. Journal mutations invalidate entry pages and the sitemap. Previously downloaded copies and search-engine snippets may persist after withdrawal; the publishing notice explains this.

SEO checks cover metadata/canonicals, ownership and publication boundaries, redirects, structured-data escaping and sitemap removal. A fictional local public story was checked in the browser.

## Review and scheduling

Private entries need no review. Public submissions appear at `/admin/founder-journal` for verified administrators and reviewers. Reviewers can approve or request changes with a note, shown in the founder dashboard. Notes are not sent by email. Existing approved content stays live while a replacement is reviewed; version checks prevent approval of an obsolete submission.

Founders can optionally choose a future publication time in IST. Approval before that time queues publication. If review occurs after the requested time, the submission returns with a note to choose a new time. Founders can resubmit or immediately make an entry private to cancel its review/schedule and withdraw the live version. Pending and scheduled revisions are excluded from public pages, metadata, sitemap and anonymous image access.

The editorial admin Journal also supports a future IST date/time on new or draft posts, rescheduling, and **Cancel schedule** to return to draft. Immediate publication remains available. Live posts must be unpublished before scheduling.

The existing BullMQ sync worker registers a `journal-publication` job every minute. It publishes only due scheduled posts, rechecks founder revisions under a transaction lock, and retries failures. Restart the sync worker when deploying this change so it registers the job. Publication can be delayed by worker/Redis outages; it is not an exact-second guarantee. Public editorial Journal routes render fresh so newly published posts appear without worker-side Next.js cache calls.

## Database and release

Apply `20261016160000_founder_journal`, `20261017120000_founder_journal_rich_text`, and `20261017130000_journal_review_and_scheduling` before starting the new code. The last migration adds review revisions, approval timestamps and editorial schedules; existing published founder entries are backfilled as approved. Generate the Prisma client during installation/build and restart the sync worker.

This feature has been built and tested locally; it is not a production deployment. The production comment-Turnstile pause and Google OAuth replacement from 16 October are separate runtime/release changes. Preserve them when preparing a release and check the active production marker and environment rather than deploying an older local baseline wholesale.

Code rollback can use the previous release while retaining the new table and user entries. Do not drop the table as a routine rollback; that would destroy journal data.

## Validation

- Latest full suite: 359 tests passed; two opt-in database cases are skipped in the default run and passed separately against disposable PostgreSQL.
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
