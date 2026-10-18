import { createHash } from "node:crypto";

export const activeNewsletterWhere = { confirmedAt: { not: null }, unsubscribedAt: null };
export const newsletterToken = /^[0-9a-f]{64}$/;
export const newsletterHash = (value: string) => createHash("sha256").update(value).digest("hex");
export const NEWSLETTER_CONSENT_VERSION = "2026-10-18-newsletter-v1";
