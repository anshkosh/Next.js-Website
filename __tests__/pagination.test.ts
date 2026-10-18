import { expect, it } from "vitest";
import { pageNumber, pageHref, searchText } from "@/lib/pagination";
it.each([undefined, null, [], ["2"], "abc", "0", "-1", "1.5", "2evil", "1e3", "Infinity", "10001", "9007199254740993"])("uses a valid first-page offset for malformed/excessive input %j", value => {
  expect(pageNumber(value)).toBe(1); expect((pageNumber(value) - 1) * 20).toBe(0);
});
it("accepts bounded whole pages and encodes every filter independently", () => {
  expect(pageNumber("2")).toBe(2); expect(pageNumber("10000")).toBe(10000);
  const href = pageHref("/discover", 2, { q: "food & page=999#bad", category: "clean/tech" });
  const url = new URL(href, "https://example.test");
  expect(url.searchParams.get("q")).toBe("food & page=999#bad"); expect(url.searchParams.get("page")).toBe("2"); expect(url.hash).toBe("");
  expect(searchText(["unexpected"])).toBe("");
});
