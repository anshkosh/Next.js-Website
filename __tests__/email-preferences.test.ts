// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const find = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { user: { findFirst: find } } }));
import { emailPreferenceAllows } from "@/lib/email/preferences";
beforeEach(() => vi.clearAllMocks());
it("honors the recipient's saved optional email choices at delivery time", async () => {
  find.mockResolvedValue({ notifyStartupReviews: false, notifyVoteMilestones: true });
  expect(await emailPreferenceAllows("startup_approved", "member@example.test")).toBe(false);
  expect(await emailPreferenceAllows("startup_rejected", "member@example.test")).toBe(false);
  expect(await emailPreferenceAllows("upvote_milestone", "member@example.test")).toBe(true);
  expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: { email: { equals: "member@example.test", mode: "insensitive" } } }));
});
it("keeps verification, newsletter consent and staff notifications independent", async () => {
  for (const template of ["welcome", "newsletter_confirmation", "new_submission", "contact_inquiry"] as const)
    expect(await emailPreferenceAllows(template, "member@example.test")).toBe(true);
  expect(find).not.toHaveBeenCalled();
});
it("stops optional startup notifications after account deletion", async () => {
  find.mockResolvedValue(null);
  expect(await emailPreferenceAllows("upvote_milestone", "visitor@example.test")).toBe(false);
  expect(await emailPreferenceAllows("startup_approved", "visitor@example.test")).toBe(false);
});
