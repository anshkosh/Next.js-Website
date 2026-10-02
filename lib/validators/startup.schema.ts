import { z } from "zod";
import { startupIdSchema } from "./id.schema";
import { pitchDeckUrlSchema } from "./pitch-deck.schema";

export const createStartupSchema = z.object({
  name: z.string().min(2).max(100),
  tagline: z.string().min(10).max(120),
  description: z.string().min(50).max(5000),
  websiteUrl: z.string().url(),
  categoryId: z.string().cuid(),
  founderName: z.string().min(2).max(100).optional(),
  logoUrl: z.string().min(1, "Logo is required").refine((val) => val.startsWith("http") || val.startsWith("/"), { message: "Please upload a valid logo" }).or(z.literal("")).optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  galleryImages: z.array(z.string()).max(4).optional(),
  // Founder contact
  startupPhone: z
    .string()
    .regex(
      /^\d{10}$/,
      "Enter a valid 10-digit mobile number"
    )
    .optional()
    .or(z.literal("")),
  // Core Proposition
  problemStatement: z
    .string()
    .min(100, "Minimum 100 characters required")
    .max(800, "Maximum 800 characters allowed")
    .optional()
    .or(z.literal("")),
  solutionStatement: z
    .string()
    .min(100, "Minimum 100 characters required")
    .max(1000, "Maximum 1000 characters allowed")
    .optional()
    .or(z.literal("")),
  targetAudience: z
    .string()
    .max(500, "Maximum 500 characters allowed")
    .optional()
    .or(z.literal("")),
  prototypeStatus: z
    .enum([
      "Working Software Prototype (Functional Beta)",
      "Physical Prototype / Hardware Sample Built",
      "Production-Ready V1 (Preparing Pilot Run)",
      "Active Live Service (Testing New Feature/Location)",
    ])
    .optional()
    .or(z.literal("")),
  tractionEvidence: z
    .string()
    .max(600, "Maximum 600 characters allowed")
    .optional()
    .or(z.literal("")),
  metadata: z
    .object({
      twitterUrl: z.string().url().optional(),
      linkedinUrl: z.string().url().optional(),
      city: z.string().optional(),
      foundedYear: z.number().int().optional(),
      pitchDeckUrl: pitchDeckUrlSchema.optional(),
      features: z.array(
        z.object({
          icon: z.string(),
          title: z.string().min(1).max(50),
          description: z.string().min(1).max(150)
        })
      ).max(6).optional(),
    })
    .optional(),
});

export const updateStartupSchema = createStartupSchema.partial().extend({
  id: startupIdSchema,
});

export const submitForReviewSchema = z.object({
  id: startupIdSchema,
});
