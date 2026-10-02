import { z } from "zod";
import { startupIdSchema, commentIdSchema } from "./id.schema";

export const submitCommentSchema = z.object({
  startupId: startupIdSchema,
  authorName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name cannot exceed 80 characters")
    .trim(),
  authorEmail: z
    .string()
    .email("Please enter a valid email address")
    .max(254, "Email too long")
    .trim()
    .toLowerCase(),
  body: z
    .string()
    .min(5, "Comment must be at least 5 characters")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
  turnstileToken: z.string().min(1, "Please complete the CAPTCHA challenge"),
});

export const replyToCommentSchema = z.object({
  commentId: commentIdSchema,
  reply: z
    .string()
    .min(5, "Reply must be at least 5 characters")
    .max(2000, "Reply cannot exceed 2000 characters")
    .trim(),
});

export type SubmitCommentInput = z.infer<typeof submitCommentSchema>;
export type ReplyToCommentInput = z.infer<typeof replyToCommentSchema>;
