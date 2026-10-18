// @vitest-environment node
import { expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ add: vi.fn(), remove: vi.fn(), order: vi.fn() }));
vi.mock("@/app/actions/featured", () => ({ addFeaturedStartup: mock.add, unfeatureStartupById: mock.remove, setFeaturedStartupSortOrder: mock.order }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: {} }));
vi.mock("@/lib/notification-outbox", () => ({ storeNotification: vi.fn(), deliverNotification: vi.fn() }));
import { featureStartup, unfeatureStartup, updateFeaturedSortOrder } from "@/app/actions/admin.actions";
it("routes all legacy feature mutations through the checked current actions", async () => {
  mock.add.mockResolvedValue({ error: "Maximum limit of 6 featured startups reached." });
  expect(await featureStartup("seventh", 0)).toEqual({ error: "Maximum limit of 6 featured startups reached." });
  expect(mock.add).toHaveBeenCalledWith("seventh", 0);
  await unfeatureStartup("startup"); expect(mock.remove).toHaveBeenCalledWith("startup");
  await updateFeaturedSortOrder("entry", 2); expect(mock.order).toHaveBeenCalledWith("entry", 2);
});
