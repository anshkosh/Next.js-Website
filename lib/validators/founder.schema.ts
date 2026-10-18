import { z } from "zod";

const webUrl = z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);
const photoUrl = z.string().max(2048).refine(value =>
  value === "" || /^\/api\/uploads\/serve\/founders\/[a-zA-Z0-9/_-]+\.webp$/.test(value) ||
  /^https?:\/\//.test(value), "Invalid photo URL");

// These are profile fields, never Prisma input types. Reject relations, scalar
// operators and unknown keys even when a caller bypasses the TypeScript client.
export const founderFields = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).optional(),
  photoUrl: photoUrl.optional(),
  linkedinUrl: webUrl.optional(),
  twitterUrl: webUrl.optional(),
}).strict();

export const createFounderSchema = founderFields.extend({ startupId: z.string().min(1).max(128) });
export const updateFounderSchema = founderFields.partial().extend({
  sortOrder: z.number().int().min(0).max(2).optional(),
}).strict();
