import { createHash } from "node:crypto";
import { founderEntrySchema } from "./founder-journal";
import { journalPlainText } from "./journal-rich-text";

export type ModerationKind = "COMMENT" | "REPLY" | "UPDATE" | "JOURNAL";
export type ModerationContent = { text: string; hasMedia: boolean; stamp: unknown };
export const MODERATION_MODEL = "@cf/meta/llama-guard-3-8b";
export const MODERATION_POLICY = "2026-10-23-v1";

export function contentHash(content: ModerationContent) {
  // PostgreSQL JSONB can reorder object keys. Preserve array order, but sort
  // object keys so a journal hashes identically before and after persistence.
  const serialized = JSON.stringify([MODERATION_POLICY, content], (_key, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : value);
  return createHash("sha256").update(serialized).digest("hex");
}

export function commentContent(row: { authorName: string; body: string }): ModerationContent {
  return { text: `${row.authorName}\n${row.body}`, hasMedia: false, stamp: null };
}
export function replyContent(row: { pendingReply: string | null; pendingRepliedBy: string | null }): ModerationContent {
  return { text: `${row.pendingRepliedBy ?? "Founder"}\n${row.pendingReply ?? ""}`, hasMedia: false, stamp: null };
}
export function updateContent(row: { title: string; body: string; imageUrl: string | null }): ModerationContent {
  return { text: `${row.title}\n${row.body}`, hasMedia: Boolean(row.imageUrl), stamp: row.imageUrl };
}
export function journalContent(data: unknown, version: number): ModerationContent {
  const entry = founderEntrySchema.parse(data);
  const text = entry.contentJson ? journalPlainText(entry.contentJson) : entry.body;
  return { text: `${entry.title}\n${text}\n${entry.milestone}`, hasMedia: Boolean(entry.contentJson?.ops.some(op => typeof op.insert !== "string")), stamp: [version, data] };
}

// Review, rather than ban, contextual business language and personal information.
// These supplement a safety model; they do not establish whether a claim is true.
export function policyReasons(content: ModerationContent): string[] {
  const reasons: string[] = [];
  if (content.hasMedia) reasons.push("Media needs human review; AI checked text only.");
  // A model safety label does not establish civility. Hold explicit personal
  // attacks for a reviewer, while leaving negative product/evidence feedback
  // eligible. This bounded English hint is not a complete harassment detector;
  // quoted or ambiguous matches need a person's contextual decision.
  const personalAttack = /\b(?:you(?:['’]re|\s+are)\s+[^.!?\n]{0,100}\b|you\s+(?:(?:complete|total|absolute|useless)\s+){0,3}|(?:the|this|that|your)\s+(?:founder|owner|team|developer)\s+(?:is|are)\s+[^.!?\n]{0,100}\b)(?:idiot|moron|imbecile|scumbag|loser|stupid|dumb)s?\b/iu;
  if (personalAttack.test(content.text.normalize("NFKC"))) reasons.push("Possible direct personal abuse; human review required.");
  if (/(?:guaranteed|risk[- ]?free|assured)\s+(?:\d+[%x]?\s+)?(?:returns?|profits?|income)|double\s+your\s+money/i.test(content.text)) reasons.push("Potential guaranteed-return promotion.");
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(content.text) || /(?:\+?\d[\s().-]*){10,}/.test(content.text)) reasons.push("Possible personal contact information.");
  if ((content.text.match(/https?:\/\//gi)?.length ?? 0) > 3) reasons.push("Many links; check for spam.");
  if (/(.)\1{19,}/u.test(content.text)) reasons.push("Repetitive text; check for spam.");
  return reasons;
}

export function parseSafetyVerdict(value: unknown): { safe: boolean; reasons: string[] } | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text === "safe") return { safe: true, reasons: [] };
  const match = /^unsafe\s*\n\s*(S(?:[1-9]|1[0-4])(?:\s*,\s*S(?:[1-9]|1[0-4]))*)\s*$/.exec(text);
  return match ? { safe: false, reasons: match[1].split(/\s*,\s*/).map(code => `Safety category ${code}; human review required.`) } : null;
}

export async function checkContent(content: ModerationContent, token: string, accountId: string) {
  const reasons = policyReasons(content);
  // Never truncate a submission and accidentally approve unchecked text.
  if (!content.text.trim() || content.text.length > 14000) throw new Error("invalid-content");
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODERATION_MODEL}`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: content.text }], max_tokens: 64, temperature: 0 }),
  });
  // Provider bodies may echo submissions or credential information. Never log them.
  if (!response.ok) throw new Error(response.status === 429 || response.status === 402 ? "quota" : "provider-unavailable");
  const data = await response.json();
  const verdict = data?.success === true ? parseSafetyVerdict(data.result?.response) : null;
  if (!verdict) throw new Error("invalid-verdict");
  return { safe: verdict.safe && reasons.length === 0, reasons: [...reasons, ...verdict.reasons] };
}
