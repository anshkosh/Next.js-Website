// @vitest-environment node
import { expect, it } from "vitest";
import { addCommentReceipt, readCommentReceipts, COMMENT_RECEIPT_TTL } from "../lib/comment-receipts";
const secret = "isolated-private-receipt-unit-test-key";
const id = "cmvddwy1h0000zgy2oi9d66n3";
const now = Date.UTC(2026, 9, 20);

it("rejects tampered, expired, oversized and differently signed receipts", () => {
  const value = addCommentReceipt(undefined, id, secret, now)!;
  expect(readCommentReceipts(value, secret, now)).toEqual([id]);
  expect(readCommentReceipts(value, "another-secret", now)).toEqual([]);
  expect(readCommentReceipts(value + "x", secret, now)).toEqual([]);
  expect(readCommentReceipts(value, secret, now + COMMENT_RECEIPT_TTL * 1000)).toEqual([]);
  expect(readCommentReceipts("x".repeat(4000), secret, now)).toEqual([]);
  expect(readCommentReceipts(value, undefined, now)).toEqual([]);
});

it("bounds private browser history and excludes malformed IDs", () => {
  let value: string | undefined;
  for (let i = 0; i < 30; i++) value = addCommentReceipt(value, `cmvddwy1h${String(i).padStart(4, "0")}zgy2oi9d66n3`, secret, now)!;
  expect(readCommentReceipts(value, secret, now)).toHaveLength(20);
  expect(value!.length).toBeLessThan(3800);
  expect(addCommentReceipt(value, "<script>", secret, now)).toBeNull();
});
