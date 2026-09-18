import crypto from "crypto";

export function generateFingerprint(ip: string, userAgent: string): string {
  const data = `${ip}:${userAgent}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}
