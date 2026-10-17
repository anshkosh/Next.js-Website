// @vitest-environment node
// Opt-in against the disposable local PostgreSQL database after migrate deploy.
import { afterAll, beforeAll, expect, it, vi } from "vitest";
const session = vi.hoisted(() => ({ id: "", get: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: session.get } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { db } from "../lib/db";
import { saveFounderEntry, deleteFounderEntry } from "../app/actions/founder-journal.actions";
import { publicFounderEntries, publicFounderEntry } from "../lib/founder-journal-queries";
import { reviewFounderEntry } from "../app/actions/founder-journal-review.actions";
import { lockFounderEntry, publishFounderRevision } from "../lib/journal-publication";
import { istDateTimeInput } from "../lib/journal-scheduling";

const enabled = process.env.JOURNAL_DATABASE_TEST === "1";
let author: string; let other: string; let reviewer: string; let startup: string; let otherStartup: string; let category: string;
beforeAll(async () => {
  if (!enabled) return;
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/anshkosh_e2e") throw new Error("Disposable local test database required");
  const unique = Date.now().toString();
  author = (await db.user.create({ data: { name: "Journal owner", email: `journal-owner-${unique}@example.test`, emailVerified: true } })).id;
  other = (await db.user.create({ data: { name: "Another founder", email: `journal-other-${unique}@example.test`, emailVerified: true } })).id;
  reviewer = (await db.user.create({ data: { name: "Journal reviewer", email: `journal-reviewer-${unique}@example.test`, emailVerified: true, role: "admin" } })).id;
  category = (await db.category.create({ data: { name: `Journal test ${unique}`, slug: `journal-test-${unique}` } })).id;
  for (const owner of [author, other]) {
    const row = await db.startup.create({ data: { founderId: owner, name: "Journal startup", slug: `journal-${owner}`, tagline: "Testing entries", description: "Disposable journal privacy test", websiteUrl: "https://example.test", founderName: "Founder", categoryId: category, status: "LIVE", galleryImages: [] } });
    if (owner === author) startup = row.id; else otherStartup = row.id;
  }
  session.id = author;
  session.get.mockImplementation(async () => ({ user: { id: session.id, emailVerified: true, banned: false, role: session.id === reviewer ? "admin" : "user" } }));
});
afterAll(async () => {
  if (!enabled) return;
  await db.startup.deleteMany({ where: { id: { in: [startup, otherStartup].filter(Boolean) } } });
  await db.user.deleteMany({ where: { id: { in: [author, other, reviewer].filter(Boolean) } } });
  if (category) await db.category.delete({ where: { id: category } });
  await db.$disconnect();
});

it.skipIf(!enabled)("preserves privacy across real database creation, publication, owner changes, withdrawal and deletion", async () => {
  const draft = { title: "Private decision", body: "Private customer notes", contentJson: { ops: [{ insert: "Private customer notes", attributes: { bold: true } }, { insert: "\n" }] }, startupId: startup, milestone: "Interview five customers", milestoneDone: true };
  expect(await saveFounderEntry(null, draft)).toEqual({ success: true });
  const entry = await db.founderJournalEntry.findFirstOrThrow({ where: { authorId: author } });
  expect(entry.visibility).toBe("PRIVATE"); expect(entry.publishedAt).toBeNull();
  expect(entry.contentJson).toEqual(draft.contentJson);
  expect(await publicFounderEntries(startup, author)).toEqual([]);
  expect(await publicFounderEntry(entry.id)).toBeNull();
  session.id = other;
  expect(await saveFounderEntry(entry.id, { ...draft, title: "Stolen" })).toHaveProperty("error");
  expect(await deleteFounderEntry(entry.id)).toHaveProperty("error");
  expect(await saveFounderEntry(null, { ...draft, visibility: "PUBLIC" })).toHaveProperty("error");
  session.id = author;
  expect(await saveFounderEntry(entry.id, { ...draft, visibility: "PUBLIC" })).toEqual({ success: true });
  expect(await publicFounderEntry(entry.id)).toBeNull();
  const revision = await db.founderJournalRevision.findUniqueOrThrow({ where: { entryId: entry.id } });
  session.id = reviewer;
  expect(await reviewFounderEntry(revision.id, revision.version, "APPROVE")).toHaveProperty("success", true);
  session.id = author;
  const publicRows = await publicFounderEntries(startup, author);
  expect((await publicFounderEntry(entry.id))?.title).toBe(draft.title);
  expect(publicRows).toHaveLength(1); expect(publicRows[0].milestoneDone).toBe(true);
  expect(publicRows[0]).not.toHaveProperty("authorId");
  await db.startup.update({ where: { id: startup }, data: { status: "SUSPENDED" } });
  expect(await publicFounderEntry(entry.id)).toBeNull();
  expect(await publicFounderEntries(startup, author)).toEqual([]);
  await db.startup.update({ where: { id: startup }, data: { status: "LIVE", founderId: other } });
  expect(await publicFounderEntries(startup, author)).toEqual([]);
  await db.startup.update({ where: { id: startup }, data: { founderId: author } });
  expect(await saveFounderEntry(entry.id, { ...draft, visibility: "PRIVATE" })).toEqual({ success: true });
  expect(await publicFounderEntry(entry.id)).toBeNull();
  expect(await publicFounderEntries(startup, author)).toEqual([]);
  expect(await deleteFounderEntry(entry.id)).toEqual({ success: true });
  expect(await db.founderJournalEntry.findUnique({ where: { id: entry.id } })).toBeNull();
});

it.skipIf(!enabled)("requires current reviewer approval, preserves live content during scheduled edits, and cancels or returns late submissions", async () => {
  session.id = author;
  const future = new Date(Date.now() + 3600000);
  const draft = { title: "Original reviewed entry", body: "Approved content", startupId: startup, visibility: "PUBLIC", scheduledFor: "" };
  expect(await saveFounderEntry(null, draft)).toEqual({ success: true });
  const entry = await db.founderJournalEntry.findFirstOrThrow({ where: { authorId: author } });
  let revision = await db.founderJournalRevision.findUniqueOrThrow({ where: { entryId: entry.id } });
  expect(await reviewFounderEntry(revision.id, revision.version, "APPROVE")).toHaveProperty("error");
  session.id = reviewer;
  expect(await reviewFounderEntry(revision.id, revision.version, "APPROVE")).toHaveProperty("success", true);
  session.id = author;
  expect(await saveFounderEntry(entry.id, { ...draft, title: "Scheduled replacement", body: "Future approved content", scheduledFor: istDateTimeInput(future) })).toEqual({ success: true });
  revision = await db.founderJournalRevision.findUniqueOrThrow({ where: { entryId: entry.id } });
  session.id = reviewer;
  expect(await reviewFounderEntry(revision.id, revision.version, "APPROVE")).toHaveProperty("success", true);
  expect((await db.founderJournalRevision.findUniqueOrThrow({ where: { id: revision.id } })).status).toBe("SCHEDULED");
  expect((await publicFounderEntry(entry.id))?.title).toBe(draft.title);
  await db.$transaction(async tx => { await lockFounderEntry(tx, entry.id); await publishFounderRevision(tx, revision, future); });
  expect((await publicFounderEntry(entry.id))?.title).toBe("Scheduled replacement");
  session.id = author;
  await saveFounderEntry(entry.id, { ...draft, scheduledFor: istDateTimeInput(future) });
  revision = await db.founderJournalRevision.findUniqueOrThrow({ where: { entryId: entry.id } });
  await saveFounderEntry(entry.id, { ...draft, body: "Revised submission", scheduledFor: istDateTimeInput(future) });
  session.id = reviewer;
  expect(await reviewFounderEntry(revision.id, revision.version, "APPROVE")).toHaveProperty("error");
  revision = await db.founderJournalRevision.findUniqueOrThrow({ where: { entryId: entry.id } });
  await db.founderJournalRevision.update({ where: { id: revision.id }, data: { scheduledAt: new Date(Date.now() - 1000) } });
  expect(await reviewFounderEntry(revision.id, revision.version, "APPROVE")).toHaveProperty("success", true);
  expect((await db.founderJournalRevision.findUniqueOrThrow({ where: { id: revision.id } })).status).toBe("CHANGES_REQUESTED");
  session.id = author;
  expect(await saveFounderEntry(entry.id, { ...draft, visibility: "PRIVATE" })).toEqual({ success: true });
  expect(await db.founderJournalRevision.findUnique({ where: { entryId: entry.id } })).toBeNull();
  expect(await publicFounderEntry(entry.id)).toBeNull();
});
