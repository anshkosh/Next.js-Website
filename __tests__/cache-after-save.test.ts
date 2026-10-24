import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ revalidate: vi.fn(), warn: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/logger", () => ({ logger: { warn: mocks.warn } }));
import { revalidateSavedPath } from "@/lib/cache-after-save";

it("reports cache refresh failure without turning a durable save into an error", () => {
  mocks.revalidate.mockImplementation(() => { throw new Error("cache refresh failed"); });
  expect(() => revalidateSavedPath("/startups/sample")).not.toThrow();
  expect(mocks.warn).toHaveBeenCalledWith("Saved change committed; cache refresh delayed", { path: "/startups/sample" });
});
