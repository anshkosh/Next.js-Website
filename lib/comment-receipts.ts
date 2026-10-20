import { createHmac, timingSafeEqual } from "node:crypto";
import { commentIdSchema } from "@/lib/validators/id.schema";

export const COMMENT_RECEIPT_COOKIE = "anshkosh_comment_receipts";
export const COMMENT_RECEIPT_TTL = 7 * 86400;
const MAX_RECEIPTS = 20;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(`comment-receipts:v1:${payload}`).digest("base64url");
}

// The browser that submitted a comment can see its pending text. An email address
// or a guessed comment ID is never proof of authorship. No email/text goes in cookies.
export function readCommentReceipts(value: string | undefined, secret: string | undefined, now = Date.now()): string[] {
  if (!value || value.length > 3800 || !secret) return [];
  const [payload, signed, extra] = value.split(".");
  if (!payload || !signed || extra || !/^[\w-]+$/.test(payload) || !/^[\w-]+$/.test(signed)) return [];
  const expected = Buffer.from(signature(payload, secret));
  const supplied = Buffer.from(signed);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return [];
  try {
    const receipt: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!receipt || typeof receipt !== "object" || !("ids" in receipt) || !("expires" in receipt)) return [];
    const { ids, expires } = receipt;
    if (!Array.isArray(ids) || ids.length > MAX_RECEIPTS || typeof expires !== "number" || expires <= now || expires > now + COMMENT_RECEIPT_TTL * 1000) return [];
    return ids.every(id => commentIdSchema.safeParse(id).success) ? ids : [];
  } catch { return []; }
}

export function addCommentReceipt(value: string | undefined, id: string, secret: string | undefined, now = Date.now()): string | null {
  if (!secret || !commentIdSchema.safeParse(id).success) return null;
  const ids = [...new Set([...readCommentReceipts(value, secret, now), id])].slice(-MAX_RECEIPTS);
  const payload = Buffer.from(JSON.stringify({ ids, expires: now + COMMENT_RECEIPT_TTL * 1000 })).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}
