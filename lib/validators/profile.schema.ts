import { z } from "zod";

// Workspace preference only: account permissions are never self-service fields.
export const profileSettingsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters for your name.")
      .max(100),
    founderMode: z.boolean(),
  })
  .strict();
