"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const emailSchema = z.string().email().max(254);

export async function subscribeToNewsletter(rawEmail: string): Promise<{ error?: string }> {
  const parsed = emailSchema.safeParse(rawEmail.trim().toLowerCase());
  if (!parsed.success) return { error: "Enter a valid email address." };
  if (!process.env.DATABASE_URL) return { error: "Newsletter signup will be available when the pilot database is connected." };

  try {
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data },
      update: { subscribedAt: new Date() },
      create: { email: parsed.data },
    });
    return {};
  } catch {
    return { error: "We couldn’t save your signup. Please try again." };
  }
}
