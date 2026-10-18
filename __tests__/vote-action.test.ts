// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ record: vi.fn(), limit: vi.fn(), cookieSet: vi.fn(), queue: vi.fn(), setting: vi.fn(), cache: vi.fn(), headers: vi.fn(), cookie: vi.fn() }));
vi.mock("@/lib/vote-store", () => ({ recordVote: mock.record }));
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: mock.limit }));
vi.mock("@/lib/db", () => ({ db: { appSetting: { findUnique: mock.setting } } }));
vi.mock("@/lib/jobs/queues", () => ({ emailQueue: { add: mock.queue } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock("next/headers", () => ({ headers: mock.headers, cookies: async () => ({ get: mock.cookie, set: mock.cookieSet }) }));
vi.mock("next/cache", () => ({ revalidatePath: mock.cache }));
vi.mock("uuid", () => ({ v4: () => "test-visitor" }));
import { toggleVote } from "../app/actions/upvote.actions";

beforeEach(() => {
  vi.clearAllMocks(); mock.limit.mockResolvedValue(true); mock.setting.mockResolvedValue(null);
  mock.headers.mockResolvedValue(new Headers({ "x-real-ip": "192.0.2.1", "user-agent": "Voting test" }));
  mock.cookie.mockReturnValue(undefined);
  mock.record.mockResolvedValue({ success: true, vote: 1, upvoteCount: 10, downvoteCount: 3, signalCount: 7, addedUpvote: true,
    startup: { name: "Test startup", slug: "test-startup", category: { slug: "test-category" }, founder: { email: "private@example.test" } } });
  mock.queue.mockResolvedValue({});
});

it("rotating cookies, user agents and spoofed forwarded addresses cannot create new identities or rate buckets", async () => {
  let count = 0;
  mock.limit.mockImplementation(async () => ++count <= 10);
  for (let i = 0; i < 12; i++) {
    mock.headers.mockResolvedValue(new Headers({ "x-real-ip": "192.0.2.1", "x-forwarded-for": `198.51.100.${i}`, "user-agent": `bot-${i}` }));
    mock.cookie.mockReturnValue({ value: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}` });
    const result = await toggleVote("fixture", 1);
    expect(result.success).toBe(i < 10);
  }
  expect(new Set(mock.limit.mock.calls.map(([key]) => key)).size).toBe(1);
  expect(new Set(mock.record.mock.calls.map(([, , identity]) => identity.fingerprintHash)).size).toBe(1);
  expect(mock.record).toHaveBeenCalledTimes(10);
});

it("rejects invalid directions and non-string IDs before reading voting identities", async () => {
  expect(await toggleVote("fixture", 9 as 1)).toMatchObject({ success: false });
  expect(await toggleVote(null as unknown as string, 1)).toMatchObject({ success: false });
  expect(mock.limit).not.toHaveBeenCalled(); expect(mock.record).not.toHaveBeenCalled();
});
it("applies the same rate limit to downvotes without storing a vote when blocked", async () => {
  mock.limit.mockResolvedValue(false);
  expect(await toggleVote("fixture", -1)).toMatchObject({ success: false, error: expect.stringContaining("Rate limit") });
  expect(mock.limit).toHaveBeenCalledWith(expect.stringMatching(/^rate-limit:upvote:/), 10, 3600);
  expect(mock.record).not.toHaveBeenCalled();
});
it("returns committed totals even when a milestone notification fails, without exposing private data", async () => {
  mock.queue.mockRejectedValue(new Error("Mail unavailable"));
  expect(await toggleVote("fixture", 1)).toEqual({ success: true, vote: 1, upvoteCount: 10, downvoteCount: 3, signalCount: 7 });
  expect(mock.cookieSet).toHaveBeenCalledWith("anshkosh_vid", "test-visitor", expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }));
  for (const path of ["/search", "/leaderboard", "/category/test-category", "/startups/test-startup"]) expect(mock.cache).toHaveBeenCalledWith(path);
});
it("reports a rejected unpublished vote without notifications or page invalidation", async () => {
  mock.record.mockResolvedValue({ success: false, error: "Only published startups can receive votes." });
  expect(await toggleVote("fixture", -1)).toMatchObject({ success: false });
  expect(mock.queue).not.toHaveBeenCalled(); expect(mock.cache).not.toHaveBeenCalled();
});
