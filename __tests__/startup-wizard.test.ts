import { describe, expect, it } from "vitest";
import {
  startupFieldErrors,
  startupFieldLabel,
  wizardFields,
  wizardStep,
} from "@/lib/startup-wizard";
import { createStartupSchema } from "@/lib/validators/startup.schema";
import { founderSetupNextStep } from "@/lib/founder-next-step";

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

  it("translates first-step schema errors into direct instructions", () => {
    const parsed = createStartupSchema.safeParse({ name: "x", tagline: "short", description: "d".repeat(70), websiteUrl: "https://example.test", categoryId: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(startupFieldErrors(parsed.error.issues)).toMatchObject({
        name: ["Enter a startup name with at least 2 characters."],
        tagline: ["Write a tagline with at least 10 characters."],
        categoryId: ["Choose a category from the list."],
      });
    }
    expect(startupFieldLabel("categoryId")).toBe("Category");
  });
});

describe("founder dashboard first actions", () => {
  it("offers a first listing before journal guidance", () => {
    expect(founderSetupNextStep([])).toMatchObject({ href: "/startup/new", label: "Create your startup" });
  });

  it("prioritizes drafts, review feedback and suspension support", () => {
    expect(founderSetupNextStep([{ id: "draft", name: "Draft", status: "DRAFT" }])).toMatchObject({ href: "/startup/draft/edit", label: "Continue draft" });
    expect(founderSetupNextStep([{ id: "rejected", name: "Needs edits", status: "REJECTED", adminNotes: "Please revise" }])).toMatchObject({ href: "/startup/rejected/edit", detail: "Please revise" });
    expect(founderSetupNextStep([{ id: "blocked", name: "Hold", status: "SUSPENDED", revision: { status: "CHANGES_REQUESTED", notes: "revise" } }])).toMatchObject({ href: "/contact", label: "Contact support" });
    expect(founderSetupNextStep([{ id: "pending", name: "Review", status: "PENDING_REVIEW" }])).toMatchObject({ href: "/dashboard", label: "Check review status" });
  });
});
