import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  startupFindFirst: vi.fn(),
  startupFindUnique: vi.fn(),
  featuredAggregate: vi.fn(),
  featuredUpsert: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/db", () => ({
  db: {
    $transaction: (callback: (tx: unknown) => unknown) => callback({
      $queryRaw: async () => [],
      startup: { findFirst: mocks.startupFindFirst, findUnique: mocks.startupFindUnique },
      featuredStartup: {
        aggregate: mocks.featuredAggregate,
        upsert: mocks.featuredUpsert,
      },
    }),
  },
}));

import { featureLatestStartupForOneDay } from "@/app/actions/featured";

describe("feature newest live startup for one day", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T10:00:00.000Z"));
    mocks.getSession.mockResolvedValue({ user: { role: "admin", emailVerified: true, banned: false, twoFactorEnabled: true }, session: { twoFactorVerified: true } });
    mocks.startupFindFirst.mockResolvedValue({ id: "latest", name: "Latest startup" });
    mocks.startupFindUnique.mockResolvedValue({ id: "latest", name: "Latest startup" });
    mocks.featuredAggregate.mockResolvedValue({ _min: { sortOrder: 0 } });
    mocks.featuredUpsert.mockResolvedValue({});
  });

  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

  it("adds the newest live listing at the top with an exact 24-hour expiry", async () => {
    const result = await featureLatestStartupForOneDay();

    expect(mocks.startupFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "LIVE", wallOptIn: true, founder: { founderMode: true } }),
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    }));
    expect(mocks.featuredUpsert).toHaveBeenCalledWith({
      where: { startupId: "latest" },
      create: {
        startupId: "latest",
        sortOrder: -1,
        featuredUntil: new Date("2026-10-19T10:00:00.000Z"),
      },
      update: {
        sortOrder: -1,
        featuredUntil: new Date("2026-10-19T10:00:00.000Z"),
      },
    });
    expect(result).toEqual({
      success: true,
      startupName: "Latest startup",
      featuredUntil: new Date("2026-10-19T10:00:00.000Z"),
    });
  });

  it("does not feature anything when there are no live startups", async () => {
    mocks.startupFindFirst.mockResolvedValue(null);
    const result = await featureLatestStartupForOneDay();

    expect(result).toEqual({ error: "There are no eligible startups for the Wall yet." });
    expect(mocks.featuredUpsert).not.toHaveBeenCalled();
  });
});
