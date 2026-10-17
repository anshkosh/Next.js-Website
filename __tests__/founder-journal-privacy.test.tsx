// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ find: vi.fn(), session: vi.fn(), startups: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { founderJournalEntry: { findMany: m.find }, startup: { findMany: m.startups } } }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: m.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); }, useRouter: () => ({ refresh: vi.fn() }) }));
import { publicFounderEntries } from "../lib/founder-journal-queries";
import FounderJournalSection from "../components/startup/FounderJournalSection";
import Workspace from "../components/dashboard/FounderWorkspace";
import JournalPage, { metadata } from "../app/(founder)/dashboard/journal/page";
beforeEach(() => { vi.clearAllMocks(); m.find.mockResolvedValue([]); m.startups.mockResolvedValue([]); m.session.mockResolvedValue({ user: { id: "founder-a" } }); });

it("public reads exclude private entries and non-live or mismatched startups in the database query", async () => {
  await publicFounderEntries("startup-a", "founder-a", 2);
  expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ where: { startupId: "startup-a", authorId: "founder-a", visibility: "PUBLIC", startup: { status: "LIVE", founderId: "founder-a" } }, skip: 10, take: 11 }));
  expect(m.find.mock.calls[0][0].select).toEqual({ id: true, title: true, body: true, contentJson: true, milestone: true, milestoneDone: true, publishedAt: true });
});
it("requires a session before reading the private journal", async () => {
  m.session.mockResolvedValue(null);
  await expect(JournalPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/login"); expect(m.find).not.toHaveBeenCalled();
});
it("only loads the current founder's entries and disables indexing", async () => {
  await JournalPage({ searchParams: Promise.resolve({ page: "2" }) });
  expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ where: { authorId: "founder-a" }, skip: 20, take: 21 }));
  expect(metadata.robots).toEqual({ index: false, follow: false });
});
it("escapes founder content instead of rendering supplied HTML", () => {
  const html = renderToStaticMarkup(<FounderJournalSection page={1} slug="startup" entries={[{ id: "entry", title: "<script>bad()</script>", body: '<img src=x onerror="bad()">', contentJson: null, milestone: null, milestoneDone: false, publishedAt: new Date("2026-10-16") }]} />);
  expect(html).not.toContain("<script>"); expect(html).not.toContain("<img"); expect(html).toContain("&lt;script&gt;");
});
it("offers compact journal and all-tools buttons without separate promotional cards", () => {
  const html = renderToStaticMarkup(<Workspace />);
  expect(html).toContain("Tools to build and launch");
  expect(html).not.toContain("<h2");
  expect(html).toContain('/dashboard/journal'); expect(html).toContain('/launch-support#tools-heading');
});
