// @vitest-environment node
import { expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { sealBackup, openBackup } from "../deploy/backup-crypto.mjs";

it("round-trips a backup with authenticated encryption and a fresh nonce", () => {
  const key = randomBytes(32), dump = Buffer.from("private database dump");
  const first = sealBackup(dump, key), second = sealBackup(dump, key);
  expect(first.equals(second)).toBe(false);
  expect(first.includes(dump)).toBe(false);
  expect(openBackup(first, key)).toEqual(dump);
});
it("rejects a wrong key, altered content, IV, authentication tag and format", () => {
  const key = randomBytes(32), original = sealBackup(Buffer.from("private data"), key);
  expect(() => openBackup(original, randomBytes(32))).toThrow();
  for (const offset of [0, 4, 16, 32]) {
    const altered = Buffer.from(original); altered[offset] ^= 1;
    expect(() => openBackup(altered, key)).toThrow();
  }
  expect(() => openBackup(original.subarray(0, 20), key)).toThrow();
  expect(() => sealBackup(Buffer.from("dump"), Buffer.alloc(16))).toThrow();
});
