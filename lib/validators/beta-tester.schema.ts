import { z } from "zod";

export const BETA_TESTER_CONSENT_VERSION = "beta-tester-v1-2026-10";

export const betaTesterRequestSchema = z.object({
  startupId: z.string().min(1).max(100),
  name: z.string().trim().min(1, "Enter your name.").max(80, "Name must be 80 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address.").max(254, "Email is too long."),
  message: z.string().trim().max(500, "Keep your note under 500 characters.").optional().default(""),
  consent: z.literal(true, { error: "Please provide consent by agreeing to the beta tester data notice." }),
  adultConfirmed: z.literal(true, { error: "Beta tester requests are currently for adults 18 and older." }),
  turnstileToken: z.string().min(1, "Please complete the CAPTCHA challenge."),
});

export const betaTesterProgramSchema = z.object({
  enabled: z.boolean(),
  description: z.string().trim().max(1000, "Description must be 1,000 characters or fewer."),
  reward: z.string().trim().max(500, "Reward details must be 500 characters or fewer.").optional().default(""),
}).superRefine((value, ctx) => {
  if (value.enabled && value.description.length < 20) {
    ctx.addIssue({ code: "custom", path: ["description"], message: "Describe what testers will try (at least 20 characters)." });
  }
});
