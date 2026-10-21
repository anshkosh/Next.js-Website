// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ session: vi.fn(), update: vi.fn(), photo: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: m.session, updateUser: m.update } } }));
vi.mock("@/lib/db", () => ({ db: { mediaUpload: { findFirst: m.photo } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/cache-after-save", () => ({ revalidateSavedPath: vi.fn() }));
import { saveProfileSettings, saveFounderMode } from "@/app/actions/profile.actions";
const valid = { name: "Member", image: "", bio: "About me", location: "Hyderabad", websiteUrl: "https://example.test", notifyStartupReviews: false, notifyVoteMilestones: false };
beforeEach(() => { vi.clearAllMocks(); m.session.mockResolvedValue({ user: { id: "owner", banned: false, image: null } }); m.update.mockResolvedValue({}); });
it("updates only allowed profile fields and saves founder mode separately", async () => {
  expect(await saveProfileSettings(valid)).toEqual({ success: true });
  expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ body: { ...valid, image: null } }));
  expect(await saveFounderMode({ founderMode: false })).toEqual({ success: true });
  expect(m.update).toHaveBeenLastCalledWith(expect.objectContaining({ body: { founderMode: false } }));
  m.update.mockClear();
  expect(await saveProfileSettings({ ...valid, role: "admin" })).toHaveProperty("error");
  expect(await saveFounderMode({ founderMode: false, id: "another-account" })).toHaveProperty("error");
  expect(m.update).not.toHaveBeenCalled();
});
it("requires an owned upload for a new profile photo and rejects external replacements", async () => {
  const image = "/api/uploads/serve/founders/photo.webp";
  m.photo.mockResolvedValue(null);
  expect(await saveProfileSettings({ ...valid, image })).toHaveProperty("error");
  expect(m.photo).toHaveBeenCalledWith({ where: { userId: "owner", key: "founders/photo.webp" }, select: { id: true } });
  expect(await saveProfileSettings({ ...valid, image: "https://another.example/photo.jpg" })).toHaveProperty("error");
  expect(m.update).not.toHaveBeenCalled();
  m.photo.mockResolvedValue({ id: "upload" });
  expect(await saveProfileSettings({ ...valid, image })).toEqual({ success: true });
});
it("requires a signed-in non-banned account for both controls", async () => {
  for (const session of [null, { user: { id: "owner", banned: true } }]) {
    m.session.mockResolvedValue(session);
    expect(await saveProfileSettings(valid)).toHaveProperty("error");
    expect(await saveFounderMode({ founderMode: false })).toHaveProperty("error");
  }
  expect(m.update).not.toHaveBeenCalled();
});
