import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  startupFindFirst: vi.fn(),
  featuredFindUnique: vi.fn(),
  featuredCount: vi.fn(),
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
      startup: { findFirst: mocks.startupFindFirst },
      featuredStartup: {
        findUnique: mocks.featuredFindUnique,
        count: mocks.featuredCount,
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
    mocks.getSession.mockResolvedValue({ user: { role: "admin" } });
    mocks.startupFindFirst.mockResolvedValue({ id: "latest", name: "Latest startup" });
    mocks.featuredFindUnique.mockResolvedValue(null);
    mocks.featuredCount.mockResolvedValue(2);
    mocks.featuredAggregate.mockResolvedValue({ _min: { sortOrder: 0 } });
    mocks.featuredUpsert.mockResolvedValue({});
  });

  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

  it("adds the newest live listing at the top with an exact 24-hour expiry", async () => {
    const result = await featureLatestStartupForOneDay();

    expect(mocks.startupFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "LIVE" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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

  it("does not exceed six active slots when the latest listing is not already featured", async () => {
    mocks.featuredCount.mockResolvedValue(6);
    const result = await featureLatestStartupForOneDay();

    expect(result).toEqual({ error: "All 6 featured slots are in use. Remove a startup or wait for a temporary feature to expire." });
    expect(mocks.featuredUpsert).not.toHaveBeenCalled();
  });

  it("does not feature anything when there are no live startups", async () => {
    mocks.startupFindFirst.mockResolvedValue(null);
    const result = await featureLatestStartupForOneDay();

    expect(result).toEqual({ error: "There are no live startups to feature yet." });
    expect(mocks.featuredCount).not.toHaveBeenCalled();
  });
});
