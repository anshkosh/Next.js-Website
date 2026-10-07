import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export function sealBackup(dump, key) {
  if (key.length !== 32 || dump.length > 256 * 1024 * 1024) throw new Error("Invalid backup encryption key or oversized dump.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(dump), cipher.final()]);
  return Buffer.concat([Buffer.from("AKB1"), iv, cipher.getAuthTag(), encrypted]);
}

export function openBackup(body, key) {
  if (key.length !== 32 || body.length < 32 || body.length > 256 * 1024 * 1024 + 32 || body.subarray(0, 4).toString() !== "AKB1") throw new Error("Invalid encrypted backup.");
  const decipher = createDecipheriv("aes-256-gcm", key, body.subarray(4, 16));
  decipher.setAuthTag(body.subarray(16, 32));
  return Buffer.concat([decipher.update(body.subarray(32)), decipher.final()]);
}
