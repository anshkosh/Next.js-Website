import { expect, test } from "vitest";
import { createStartupSchema, updateStartupSchema } from "../lib/validators/startup.schema";

test("CRUD-05: Zod validation returns errors for empty startup form", () => {
  const result = createStartupSchema.safeParse({});
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.length).toBeGreaterThan(0);
  }
});

const validStartup = {
  name: "Example startup",
  tagline: "A useful startup for a focused audience",
  description: "A concrete description of the startup and its audience, long enough for the profile form.",
  categoryId: "cmu7wfiv7000bzglryqzerzjo",
};
const id = "6b0ef103-2a8d-4232-8cff-68cf9a8a1ea9";

test.each([
  "Website: https://www.clarrx.com",
  "website:https://example.com",
  "javascript:alert(1)",
  "data:text/html,hello",
  "mailto:founder@example.com",
  "ftp://example.com",
  "/startups/example",
  "//example.com",
  "https:example.com",
  "",
])("rejects a non-HTTP website address on both create and edit: %s", websiteUrl => {
  for (const result of [
    createStartupSchema.safeParse({ ...validStartup, websiteUrl }),
    updateStartupSchema.safeParse({ id, websiteUrl }),
  ]) {
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some(issue => issue.path[0] === "websiteUrl")).toBe(true);
  }
});

test.each([
  ["https://example.com", "https://example.com"],
  ["http://example.com/path?source=profile#details", "http://example.com/path?source=profile#details"],
  ["HTTPS://example.com", "HTTPS://example.com"],
  ["  https://example.com/path  ", "https://example.com/path"],
])("accepts complete web addresses and trims surrounding whitespace: %s", (websiteUrl, expected) => {
  expect(createStartupSchema.parse({ ...validStartup, websiteUrl }).websiteUrl).toBe(expected);
  expect(updateStartupSchema.parse({ id, websiteUrl }).websiteUrl).toBe(expected);
});

test("partial edits can omit the website field", () => {
  expect(updateStartupSchema.parse({ id, name: "New name" })).not.toHaveProperty("websiteUrl");
});
