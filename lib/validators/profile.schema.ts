import { z } from "zod";
import { accountToday } from "../account-dates";

export const dateOfBirthSchema = z.union([z.literal(""), z.iso.date()])
  .refine(value => !value || value <= accountToday(), "Date of birth cannot be in the future.");

export const founderModeSchema = z.object({ founderMode: z.boolean() }).strict();

export const profileWebsiteSchema = z.string().trim().max(500).refine(value => {
  if (!value) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Enter a complete http or https website address.");

// Account permissions and founder mode have separate controls.
export const profileSettingsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters for your name.")
      .max(100),
    image: z.string().max(2048),
    bio: z.string().trim().max(500, "Keep your bio under 500 characters."),
    location: z.string().trim().max(100),
    websiteUrl: profileWebsiteSchema,
    dateOfBirth: dateOfBirthSchema.optional(),
    notifyStartupReviews: z.boolean(),
    notifyVoteMilestones: z.boolean(),
    notifyCommentActivity: z.boolean().optional(),
  })
  .strict();
