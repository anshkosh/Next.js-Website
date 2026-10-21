import { describe, expect, it } from "vitest";
import {
  startupFieldErrors,
  startupFieldLabel,
  wizardFields,
  wizardStep,
} from "@/lib/startup-wizard";
import { createStartupSchema } from "@/lib/validators/startup.schema";

describe("startup wizard recovery and actionable errors", () => {
  it("maps nested feature errors to their inputs instead of a generic metadata key", () => {
    const parsed = createStartupSchema.safeParse({
      name: "Example",
      tagline: "A useful example startup",
      description: "d".repeat(70),
      websiteUrl: "https://example.test",
      categoryId: "cm12345678901234567890123",
      metadata: { features: [{ icon: "Zap", title: "", description: "" }] },
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const errors = startupFieldErrors(parsed.error.issues);
      expect(errors["features.0.title"]).toHaveLength(1);
      expect(errors["features.0.description"]).toHaveLength(1);
      expect(errors).not.toHaveProperty("metadata");
      expect(startupFieldLabel("features.0.description")).toBe(
        "Feature 1 description",
      );
    }
  });
  it("bounds persisted navigation and initializes optional media and features", () => {
    for (const value of [undefined, [], "NaN", "0", "7", "2.5"])
      expect(wizardStep(value)).toBe(1);
    expect(wizardStep("4")).toBe(4);
    expect(wizardFields(null)).toMatchObject({
      features: [],
      galleryImages: [],
      pitchDeckVisibility: "private",
      name: "",
    });
  });
});
