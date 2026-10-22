import { z } from "zod";
import { profileWebsiteSchema, dateOfBirthSchema } from "./validators/profile.schema";

// Profile preferences never grant admin/reviewer authorization.
export const accountProfileFields = {
  founderMode: {
    type: "boolean",
    required: false,
    defaultValue: false,
    input: true,
    validator: { input: z.boolean() },
  },
  bio: { type: "string", required: false, defaultValue: "", input: true, validator: { input: z.string().trim().max(500) } },
  location: { type: "string", required: false, defaultValue: "", input: true, validator: { input: z.string().trim().max(100) } },
  websiteUrl: { type: "string", required: false, defaultValue: "", input: true, validator: { input: profileWebsiteSchema } },
  dateOfBirth: { type: "string", required: false, defaultValue: "", input: true, validator: { input: dateOfBirthSchema } },
  notifyStartupReviews: { type: "boolean", required: false, defaultValue: true, input: true, validator: { input: z.boolean() } },
  notifyVoteMilestones: { type: "boolean", required: false, defaultValue: true, input: true, validator: { input: z.boolean() } },
} as const;
