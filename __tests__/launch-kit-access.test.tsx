// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/db", () => ({ db: { startup: { findFirst: mocks.find } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); }, notFound: () => { throw new Error("not-found"); } }));
import Page, { metadata } from "../app/(founder)/startup/[id]/launch-kit/page";
const id = "6b0ef103-2a8d-4232-8cff-68cf9a8a1ea9";
beforeEach(() => {
  vi.clearAllMocks(); mocks.session.mockResolvedValue({ user: { id: "owner" } });
  mocks.find.mockResolvedValue({ name: "Startup", tagline: "Pitch", description: "Details", websiteUrl: "https://example.com", galleryImages: [], founders: [] });
});
describe("owned startup launch kits", () => {
  it("requires a session before reading any startup", async () => {
    mocks.session.mockResolvedValue(null);
    await expect(Page({ params: Promise.resolve({ id }) })).rejects.toThrow("redirect:/login");
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it("rejects malformed IDs before querying", async () => {
    await expect(Page({ params: Promise.resolve({ id: "bad-id" }) })).rejects.toThrow("not-found");
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it("enforces ownership in the database query and selects no private metadata", async () => {
    await Page({ params: Promise.resolve({ id }) });
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({ where: { id, founderId: "owner" } }));
    const select = mocks.find.mock.calls[0][0].select;
    expect(select.metadata).toBeUndefined(); expect(select.startupPhone).toBeUndefined(); expect(select.adminNotes).toBeUndefined();
    expect(select.founders.select).toEqual({ name: true, role: true });
  });
  it("does not disclose another owner's or a missing startup", async () => {
    mocks.find.mockResolvedValue(null);
    await expect(Page({ params: Promise.resolve({ id }) })).rejects.toThrow("not-found");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
