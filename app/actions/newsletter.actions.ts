"use server";

import { z } from "zod";
import { randomBytes, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/utils/client-ip";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { emailQueue } from "@/lib/jobs/queues";
import { SITE_URL } from "@/lib/seo";
import { activeNewsletterWhere, newsletterHash, newsletterToken, NEWSLETTER_CONSENT_VERSION } from "@/lib/newsletter";

const signup = z.object({ email: z.string().trim().toLowerCase().email().max(254), consent: z.literal(true), token: z.string().max(2048) }).strict();

export async function subscribeToNewsletter(input: unknown): Promise<{ error?: string }> {
  const parsed = signup.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email and consent to receive the newsletter." };
  if (!process.env.DATABASE_URL) return { error: "Newsletter signup is temporarily unavailable." };
  try {
    const fingerprint = newsletterHash(clientIp(await headers()));
    if (!await checkRateLimit(`newsletter:ip:${fingerprint}`, 3, 3600)) return { error: "Too many requests. Please try again later." };
    if (!await verifyTurnstileToken(parsed.data.token)) return { error: "Please complete the security check and try again." };
    const email = parsed.data.email;
    if (!await checkRateLimit(`newsletter:email:${newsletterHash(email)}`, 1, 86400)) return {};
    if (await db.newsletterSubscriber.findFirst({ where: { email, ...activeNewsletterWhere }, select: { id: true } })) return {};
    const token = randomBytes(32).toString("hex");
    const hash = newsletterHash(token);
    const verification = await db.verification.create({ data: {
      id: randomUUID(), identifier: `newsletter:${hash}`,
      value: JSON.stringify({ email, consentVersion: NEWSLETTER_CONSENT_VERSION, requestedAt: new Date().toISOString() }),
      expiresAt: new Date(Date.now() + 86400000),
    } });
    try {
      await emailQueue.add("newsletter_confirmation", { template: "newsletter_confirmation", to: email,
        data: { confirmationUrl: `${SITE_URL}/newsletter/confirm?token=${token}` } }, { jobId: `newsletter-${verification.id}` });
    } catch {
      await db.verification.deleteMany({ where: { id: verification.id } });
      return { error: "Confirmation email is delayed. Please try again tomorrow or contact hello@anshkosh.com." };
    }
    return {};
  } catch { return { error: "We couldn’t process your request. Please try again later." }; }
}

export async function confirmNewsletter(token: string) {
  if (typeof token !== "string" || !newsletterToken.test(token)) return { error: "Invalid confirmation link." };
  const hash = newsletterHash(token);
  try {
    return await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`newsletter:${hash}`}))::text`;
      const pending = await tx.verification.findFirst({ where: { identifier: `newsletter:${hash}`, expiresAt: { gt: new Date() } } });
      if (!pending) {
        const already = await tx.newsletterSubscriber.findFirst({ where: { unsubscribeTokenHash: hash, ...activeNewsletterWhere }, select: { id: true } });
        return already ? { success: true as const } : { error: "This link has expired or is no longer valid. Please sign up again." };
      }
      const data = z.object({ email: z.string().email(), consentVersion: z.literal(NEWSLETTER_CONSENT_VERSION), requestedAt: z.iso.datetime() }).parse(JSON.parse(pending.value));
      await tx.newsletterSubscriber.upsert({ where: { email: data.email },
        create: { email: data.email, consentVersion: data.consentVersion, subscribedAt: new Date(data.requestedAt), confirmedAt: new Date(), unsubscribeTokenHash: hash },
        update: { consentVersion: data.consentVersion, subscribedAt: new Date(data.requestedAt), confirmedAt: new Date(), unsubscribedAt: null, unsubscribeTokenHash: hash } });
      await tx.verification.deleteMany({ where: { id: pending.id } });
      return { success: true as const };
    });
  } catch { return { error: "Confirmation is temporarily unavailable. Please try again." }; }
}

export async function unsubscribeNewsletter(token: string) {
  if (typeof token !== "string" || !newsletterToken.test(token)) return { error: "Invalid unsubscribe link." };
  try {
    await db.newsletterSubscriber.updateMany({ where: { unsubscribeTokenHash: newsletterHash(token), unsubscribedAt: null }, data: { unsubscribedAt: new Date() } });
    return { success: true as const };
  } catch { return { error: "Please try again or contact hello@anshkosh.com to withdraw." }; }
}
