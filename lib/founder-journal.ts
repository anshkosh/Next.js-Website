import { z } from "zod";
import { journalDeltaSchema, journalPlainText } from "@/lib/journal-rich-text";

export const JOURNAL_PROMPTS = {
  FREE_WRITE: { label: "Free writing", text: "" },
  PROGRESS: { label: "Progress", text: "What moved forward? What helped? What will I try next?" },
  BLOCKER: { label: "A challenge", text: "What is blocking me? What have I tried? What help would make a difference?" },
  LESSON: { label: "A lesson", text: "What did I expect? What actually happened? What will I do differently?" },
  WEEKLY: { label: "Weekly review", text: "Wins this week\n\nLessons learned\n\nWhat needs attention\n\nNext week's focus" },
} as const;

export const founderEntrySchema = z.object({
  title: z.string().trim().min(1, "Give your entry a title.").max(180),
  body: z.string().trim().max(12000).default(""),
  contentJson: journalDeltaSchema.nullable().optional(),
  prompt: z.enum(["FREE_WRITE", "PROGRESS", "BLOCKER", "LESSON", "WEEKLY"]).default("FREE_WRITE"),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).default("PRIVATE"),
  startupId: z.string().trim().max(100).nullable().optional(),
  milestone: z.string().trim().max(180).default(""),
  milestoneDone: z.boolean().default(false),
}).superRefine((entry, ctx) => {
  const text = entry.contentJson ? journalPlainText(entry.contentJson) : entry.body;
  if (!text || text.length > 12000) ctx.addIssue({ code: "custom", path: ["body"], message: text ? "Keep your entry under 12,000 characters." : "Write something before saving." });
  if (entry.visibility === "PUBLIC" && !entry.startupId) {
    ctx.addIssue({ code: "custom", path: ["startupId"], message: "Choose a live startup for your public entry." });
  }
});

export type FounderEntryInput = z.input<typeof founderEntrySchema>;
export function journalPage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 10000 ? page : 1;
}
