import { z } from "zod";

// Imported Supabase records retain their UUIDs; native records use Prisma CUIDs.
export const startupIdSchema = z.union([z.string().cuid(), z.string().uuid()]);

export const commentIdSchema = z.union([
  z.string().cuid(),
  z.string().regex(/^supabase-question-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
]);
