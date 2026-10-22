import { z } from "zod";
import { startupIdSchema, commentIdSchema } from "./id.schema";
import { characterCount } from "../characters";

const messageText = (label: string) => z.string().max(32000, `${label} is too large`).trim()
  .refine(value => characterCount(value) >= 5, `${label} must be at least 5 characters`)
  .refine(value => characterCount(value) <= 2000, `${label} cannot exceed 2000 characters`);

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
  body: messageText("Comment"),
  turnstileToken: z.string().min(1, "Please complete the CAPTCHA challenge"),
});

export const replyToCommentSchema = z.object({
  commentId: commentIdSchema,
  reply: messageText("Reply"),
});

export type SubmitCommentInput = z.infer<typeof submitCommentSchema>;
export type ReplyToCommentInput = z.infer<typeof replyToCommentSchema>;
