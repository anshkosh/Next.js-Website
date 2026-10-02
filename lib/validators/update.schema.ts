import { z } from "zod";
import { startupIdSchema } from "./id.schema";

const imageUrlSchema = z
  .string()
  .refine(
    (val) => !val || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/"),
    { message: "Please upload a valid image or provide a valid URL" }
  )
  .optional()
  .or(z.literal(""));

export const createUpdateSchema = z.object({
  startupId: startupIdSchema,
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title cannot exceed 200 characters"),
  body: z.string().min(10, "Body must be at least 10 characters").max(5000, "Body cannot exceed 5000 characters"),
  imageUrl: imageUrlSchema,
});

export const updateUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title cannot exceed 200 characters").optional(),
  body: z.string().min(10, "Body must be at least 10 characters").max(5000, "Body cannot exceed 5000 characters").optional(),
  imageUrl: imageUrlSchema,
});

