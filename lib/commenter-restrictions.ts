import "server-only";
import { createHmac } from "node:crypto";

export type ModerationBanDuration = "1d" | "7d" | "30d" | "permanent";

export function commenterEmailHash(email: string): string | null {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
}

export function moderationExpiry(duration: ModerationBanDuration, now = new Date()): Date | null {
  const days: Record<Exclude<ModerationBanDuration, "permanent">, number> = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
  };
  return duration === "permanent" ? null : new Date(now.getTime() + days[duration] * 24 * 60 * 60 * 1000);
}

export function parseModerationDuration(value: unknown): ModerationBanDuration | null {
  return value === "1d" || value === "7d" || value === "30d" || value === "permanent" ? value : null;
}
