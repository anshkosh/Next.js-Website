import { expect, test } from "vitest";
import { createStartupSchema } from "../lib/validators/startup.schema";

test("CRUD-05: Zod validation returns errors for empty startup form", () => {
  const result = createStartupSchema.safeParse({});
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.length).toBeGreaterThan(0);
  }
});
