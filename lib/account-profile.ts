import { z } from "zod";

// A workspace preference, independent of the admin/reviewer authorization role.
export const accountProfileFields = {
  founderMode: {
    type: "boolean",
    required: false,
    defaultValue: true,
    input: true,
    validator: { input: z.boolean() },
  },
} as const;
