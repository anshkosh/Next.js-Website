"use server";
import { CONTACT_RESPONSE_TARGET } from "@/lib/contact-copy";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateFingerprint } from "@/lib/utils/fingerprint";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { contactSchema } from "@/lib/validators/contact.schema";
import { sendEmail } from "@/lib/email/adapter";
import { renderEmailTemplate } from "@/lib/email/templates";

// ──────────────────────────────────────────────────────────────────────────────
// Public — Submit a contact form inquiry
// ──────────────────────────────────────────────────────────────────────────────
export async function submitContactForm(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  turnstileToken: string;
}) {
  try {
    // 1. Validate input
    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { name, email, subject, message, turnstileToken } = parsed.data;

    // 2. Verify Turnstile CAPTCHA
    const tokenValid = await verifyTurnstileToken(turnstileToken);
    if (!tokenValid) {
      return { error: "CAPTCHA verification failed. Please try again." };
    }

    // 3. Rate limiting: 3 submissions per IP per hour
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown";
    const fingerprint = generateFingerprint(ip, userAgent);
    const rateLimitKey = `rate-limit:contact:${fingerprint}`;
    const isAllowed = await checkRateLimit(rateLimitKey, 3, 3600);
    if (!isAllowed) {
      return {
        error: "Too many messages sent recently. Please try again in an hour.",
      };
    }

    const submittedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "long",
      timeStyle: "short",
    });

    // 4a. Determine admin recipients from DB setting, fallback to EMAIL_FROM env
    const setting = await db.appSetting.findUnique({
      where: { key: "contact_notification_emails" },
    });
    const fallbackEmail = process.env.EMAIL_FROM || "hello@anshkosh.com";
    const rawEmails = setting?.value?.trim() || "";
    const adminRecipients: string[] = rawEmails
      ? rawEmails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [fallbackEmail];

    const adminHtml = await renderEmailTemplate("contact_inquiry", {
      senderName: name,
      senderEmail: email,
      subject,
      message,
      submittedAt,
    });

    // Send to every configured admin recipient
    await Promise.all(
      adminRecipients.map((to) =>
        sendEmail({
          to,
          subject: `[Contact] ${subject} — from ${name}`,
          html: adminHtml,
        }),
      ),
    );

    // 4b. Auto-reply to sender
    const autoReplyHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #fafafa;">
        <div style="background: #E8521E; border-radius: 12px 12px 0 0; padding: 24px 28px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; letter-spacing: 0.05em;">ANSH<span style="color: #FFD6C4;">KOSH</span></h1>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 28px;">
          <p style="color: #111827; font-size: 16px; margin: 0 0 12px;">Hi ${name},</p>
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
            Thanks for reaching out! We've received your message about <strong>${subject}</strong>. ${CONTACT_RESPONSE_TARGET}
          </p>
          <p style="color: #6B7280; font-size: 13px; margin: 0;">
            — The Anshkosh Team
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: `We received your message — Anshkosh`,
      html: autoReplyHtml,
      text: `Hi ${name}, thanks for reaching out! We received your message about "${subject}". ${CONTACT_RESPONSE_TARGET}\n\n— The Anshkosh Team`,
    });

    return { success: true };
  } catch (err) {
    logger.error("submitContactForm error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
