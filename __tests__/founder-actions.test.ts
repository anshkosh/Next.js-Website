// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn(), update: vi.fn(), create: vi.fn(), remove: vi.fn(), startup: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/db", () => ({ db: {
  startup: { findUnique: mock.startup },
  startupFounder: { findUnique: mock.find, update: mock.update, create: mock.create, delete: mock.remove, count: async () => 0 },
} }));
import { createFounder, updateFounder, deleteFounder } from "@/app/actions/founder.actions";

beforeEach(() => {
  vi.clearAllMocks();
  mock.session.mockResolvedValue({ user: { id: "owner", emailVerified: true, banned: false, role: "user" } });
  mock.find.mockResolvedValue({ id: "team", startup: { founderId: "owner" } });
  mock.startup.mockResolvedValue({ id: "startup", founderId: "owner" });
  mock.update.mockImplementation(async ({ data }) => ({ id: "team", ...data }));
});

describe("founder action runtime authorization", () => {
  it("rejects a nested account-role change without invoking a database write", async () => {
    const account = { role: "user" };
    mock.update.mockImplementation(async () => { account.role = "admin"; });
    expect(await updateFounder("team", { startup: { update: { founder: { update: { role: "admin" } } } } }))
      .toEqual({ error: "Invalid founder details" });
    expect(account.role).toBe("user");
    expect(mock.update).not.toHaveBeenCalled();
    expect(mock.find).not.toHaveBeenCalled();
  });
  it.each([
    { startupId: "other" }, { startup: { connect: { id: "other" } } },
    { name: { set: "nested operator" } }, { id: "replacement" }, { sortOrder: -1 },
  ])("rejects unexpected fields and scalar operators: %j", async payload => {
    expect((await updateFounder("team", payload)).error).toBeTruthy();
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("also closes nested-write injection on creation", async () => {
    expect((await createFounder({ startupId: "startup", name: "Founder", startup: { update: { status: "LIVE" } } })).error).toBeTruthy();
    expect(mock.create).not.toHaveBeenCalled();
  });
  it("permits profile edits, not account roles, and scopes the mutation to the owner", async () => {
    expect((await updateFounder("team", { name: " Ada ", role: "CEO" })).data?.name).toBe("Ada");
    expect(mock.update).toHaveBeenCalledWith({
      where: { id: "team", startup: { founderId: "owner" } },
      data: { name: "Ada", role: "CEO", photoUrl: undefined, linkedinUrl: undefined, twitterUrl: undefined, sortOrder: undefined },
    });
  });
  it("rejects another owner's record", async () => {
    mock.find.mockResolvedValue({ startup: { founderId: "other" } });
    expect((await updateFounder("team", { name: "Ada" })).error).toBe("Unauthorized");
    expect(mock.update).not.toHaveBeenCalled();
  });
  it.each([null, { user: { id: "owner", emailVerified: false } }, { user: { id: "owner", emailVerified: true, banned: true } }])
    ("requires a verified, non-banned session for all mutations", async session => {
      mock.session.mockResolvedValue(session);
      expect((await updateFounder("team", { name: "Ada" })).error).toBe("Unauthorized");
      expect((await createFounder({ startupId: "startup", name: "Ada" })).error).toBe("Unauthorized");
      expect((await deleteFounder("team")).error).toBe("Unauthorized");
      expect(mock.update).not.toHaveBeenCalled(); expect(mock.create).not.toHaveBeenCalled(); expect(mock.remove).not.toHaveBeenCalled();
    });
});
