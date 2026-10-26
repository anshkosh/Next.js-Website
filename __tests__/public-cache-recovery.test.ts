// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const redis = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), disconnect: vi.fn(), create: vi.fn() }));
vi.mock("ioredis", () => ({ default: class {
  constructor(options: unknown) { redis.create(options); }
  on() {}
  get = redis.get; set = redis.set; disconnect = redis.disconnect;
} }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); vi.resetModules(); });

it("recovers after the cooldown even when requests continue during an outage", async () => {
  vi.useFakeTimers(); vi.setSystemTime(0);
  const { publicCache } = await import("../lib/public-cache");
  redis.get.mockRejectedValueOnce(new Error("offline")).mockResolvedValue("recovered");
  await expect(publicCache.get("fixture")).rejects.toThrow("unavailable");
  for (const time of [1000, 2000, 4000]) {
    vi.setSystemTime(time);
    await expect(publicCache.get("fixture")).rejects.toThrow("unavailable");
  }
  expect(redis.create).toHaveBeenCalledTimes(1);
  vi.setSystemTime(5001);
  expect(await publicCache.get("fixture")).toBe("recovered");
  expect(redis.create).toHaveBeenCalledTimes(2);
});
