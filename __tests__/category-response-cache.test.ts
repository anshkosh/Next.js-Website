// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const categories = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { category: { findMany: categories } } }));
import { GET } from "../app/api/categories/route";
afterEach(() => vi.clearAllMocks());

it("allows brief shared caching of public category labels only", async () => {
  categories.mockResolvedValue([{ id: "fixture", name: "Technology", iconName: "Rocket" }]);
  const response = await GET();
  expect(response.headers.get("cache-control")).toBe("public, max-age=60, s-maxage=60");
  expect(categories.mock.calls[0][0].select).toEqual({ id: true, name: true, iconName: true });
  expect(await response.json()).toEqual([{ id: "fixture", name: "Technology", iconName: "Rocket" }]);
});
it("does not cache a failed database response", async () => {
  categories.mockRejectedValue(new Error("unavailable"));
  const response = await GET();
  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
