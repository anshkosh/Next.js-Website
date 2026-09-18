import { expect, test } from "vitest";
import { generateSlug } from "../lib/utils/slug";

test("CRUD-03: Slug auto-generation", () => {
  expect(generateSlug("My AI App")).toBe("my-ai-app");
  expect(generateSlug("  Hello World  ")).toBe("hello-world");
  expect(generateSlug("Testing! @#%")).toBe("testing");
});
