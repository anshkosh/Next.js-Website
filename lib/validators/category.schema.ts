import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  iconName: z.string().max(50).optional(),
});
