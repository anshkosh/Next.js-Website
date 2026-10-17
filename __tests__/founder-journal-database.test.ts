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
import { publicFounderEntries } from "../lib/founder-journal-queries";

const enabled = process.env.JOURNAL_DATABASE_TEST === "1";
let author: string; let other: string; let startup: string; let otherStartup: string; let category: string;
beforeAll(async () => {
  if (!enabled) return;
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/anshkosh_e2e") throw new Error("Disposable local test database required");
  const unique = Date.now().toString();
  author = (await db.user.create({ data: { name: "Journal owner", email: `journal-owner-${unique}@example.test`, emailVerified: true } })).id;
  other = (await db.user.create({ data: { name: "Another founder", email: `journal-other-${unique}@example.test`, emailVerified: true } })).id;
  category = (await db.category.create({ data: { name: `Journal test ${unique}`, slug: `journal-test-${unique}` } })).id;
  for (const owner of [author, other]) {
    const row = await db.startup.create({ data: { founderId: owner, name: "Journal startup", slug: `journal-${owner}`, tagline: "Testing entries", description: "Disposable journal privacy test", websiteUrl: "https://example.test", founderName: "Founder", categoryId: category, status: "LIVE", galleryImages: [] } });
    if (owner === author) startup = row.id; else otherStartup = row.id;
  }
  session.id = author;
  session.get.mockImplementation(async () => ({ user: { id: session.id, emailVerified: true, banned: false } }));
});
afterAll(async () => {
  if (!enabled) return;
  await db.startup.deleteMany({ where: { id: { in: [startup, otherStartup].filter(Boolean) } } });
  await db.user.deleteMany({ where: { id: { in: [author, other].filter(Boolean) } } });
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
  session.id = other;
  expect(await saveFounderEntry(entry.id, { ...draft, title: "Stolen" })).toHaveProperty("error");
  expect(await deleteFounderEntry(entry.id)).toHaveProperty("error");
  expect(await saveFounderEntry(null, { ...draft, visibility: "PUBLIC" })).toHaveProperty("error");
  session.id = author;
  expect(await saveFounderEntry(entry.id, { ...draft, visibility: "PUBLIC" })).toEqual({ success: true });
  const publicRows = await publicFounderEntries(startup, author);
  expect(publicRows).toHaveLength(1); expect(publicRows[0].milestoneDone).toBe(true);
  expect(publicRows[0]).not.toHaveProperty("authorId");
  await db.startup.update({ where: { id: startup }, data: { status: "SUSPENDED" } });
  expect(await publicFounderEntries(startup, author)).toEqual([]);
  await db.startup.update({ where: { id: startup }, data: { status: "LIVE", founderId: other } });
  expect(await publicFounderEntries(startup, author)).toEqual([]);
  await db.startup.update({ where: { id: startup }, data: { founderId: author } });
  expect(await saveFounderEntry(entry.id, { ...draft, visibility: "PRIVATE" })).toEqual({ success: true });
  expect(await publicFounderEntries(startup, author)).toEqual([]);
  expect(await deleteFounderEntry(entry.id)).toEqual({ success: true });
  expect(await db.founderJournalEntry.findUnique({ where: { id: entry.id } })).toBeNull();
});
