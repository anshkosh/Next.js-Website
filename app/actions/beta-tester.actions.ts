"use server";

import { publicStartupWhere } from "@/lib/startup-visibility";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateFingerprint } from "@/lib/utils/fingerprint";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { daysAgo, BETA_PENDING_DAYS } from "@/lib/beta-retention";
import { clientIp } from "@/lib/utils/client-ip";
import {
  BETA_TESTER_CONSENT_VERSION,
  betaTesterProgramSchema,
  betaTesterRequestSchema,
} from "@/lib/validators/beta-tester.schema";

async function founderSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.emailVerified || session.user.banned) return null;
  return session.user;
}

export async function submitBetaTesterRequest(input: unknown): Promise<{ success?: true; error?: string }> {
  const parsed = betaTesterRequestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const { startupId, name, email, message, turnstileToken } = parsed.data;
  if (!(await verifyTurnstileToken(turnstileToken))) {
    return { error: "CAPTCHA verification failed. Please try again." };
  }

  try {
    const requestHeaders = await headers();
    const fingerprint = generateFingerprint(clientIp(requestHeaders), "beta-tester-v2");
    if (!(await checkRateLimit(`rate-limit:beta-tester:${fingerprint}`, 3, 3600))) {
      return { error: "Too many beta requests from this connection. Please try again later." };
    }

    const program = await db.betaTesterProgram.findFirst({
      where: { startupId, enabled: true, startup: publicStartupWhere },
      select: { id: true, startup: { select: { slug: true } } },
    });
    if (!program) return { error: "Beta tester signups are closed for this startup." };

    const normalizedEmail = email.toLowerCase();
    const existing = await db.betaTesterRequest.findUnique({
      where: { programId_email: { programId: program.id, email: normalizedEmail } },
      select: { id: true },
    });
    if (!existing) {
      await db.betaTesterRequest.create({
        data: {
          programId: program.id,
          name,
          email: normalizedEmail,
          message: message || null,
          consentedAt: new Date(),
          consentVersion: BETA_TESTER_CONSENT_VERSION,
        },
      });
    }

    revalidatePath(`/startups/${program.startup.slug}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    // Avoid putting a visitor's email or note into server logs.
    return { error: "We couldn’t save your request. Please try again." };
  }
}

export async function saveBetaTesterProgram(
  startupId: string,
  input: unknown,
): Promise<{ success?: true; error?: string }> {
  const user = await founderSession();
  if (!user) return { error: "Sign in with a verified founder account to manage beta signups." };
  const parsed = betaTesterProgramSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the beta signup details." };

  const startup = await db.startup.findFirst({
    where: { id: startupId, founderId: user.id },
    select: { id: true, slug: true, status: true },
  });
  if (!startup) return { error: "Startup not found." };
  if (parsed.data.enabled && startup.status !== "LIVE") {
    return { error: "Only a live startup can accept beta tester requests." };
  }

  await db.betaTesterProgram.upsert({
    where: { startupId },
    create: {
      startupId,
      enabled: parsed.data.enabled,
      description: parsed.data.description || "Beta tester signups are currently closed.",
      reward: parsed.data.reward || null,
    },
    update: {
      enabled: parsed.data.enabled,
      description: parsed.data.description || "Beta tester signups are currently closed.",
      reward: parsed.data.reward || null,
    },
  });

  revalidatePath(`/startup/${startupId}/beta-testers`);
  revalidatePath(`/startups/${startup.slug}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function reviewBetaTesterRequest(
  requestId: string,
  decision: "APPROVED" | "DECLINED",
): Promise<{ success?: true; error?: string }> {
  const user = await founderSession();
  if (!user) return { error: "Sign in with a verified founder account to review requests." };
  if (decision !== "APPROVED" && decision !== "DECLINED") return { error: "Invalid review decision." };

  const request = await db.betaTesterRequest.findFirst({
    where: { id: requestId, program: { startup: { founderId: user.id } } },
    select: { id: true, status: true, program: { select: { startup: { select: { id: true, slug: true } } } } },
  });
  if (!request) return { error: "Beta tester request not found." };
  if (request.status !== "PENDING") return { error: "This request has already been reviewed." };

  const result = await db.betaTesterRequest.updateMany({
    where: { id: request.id, status: "PENDING", createdAt: { gte: daysAgo(BETA_PENDING_DAYS) }, program: { startup: { founderId: user.id } } },
    data: {
      status: decision,
      reviewedAt: new Date(),
      ...(decision === "DECLINED" ? { name: null, email: null, message: null } : {}),
    },
  });
  if (result.count !== 1) return { error: "This request has already been reviewed." };

  revalidatePath(`/startup/${request.program.startup.id}/beta-testers`);
  revalidatePath(`/startups/${request.program.startup.slug}`);
  return { success: true };
}

export async function deleteBetaTesterRequest(requestId: string): Promise<{ success?: true; error?: string }> {
  const user = await founderSession();
  if (!user) return { error: "Sign in with a verified founder account to remove a request." };

  const request = await db.betaTesterRequest.findFirst({
    where: { id: requestId, program: { startup: { founderId: user.id } } },
    select: { id: true, program: { select: { startup: { select: { id: true } } } } },
  });
  if (!request) return { error: "Beta tester request not found." };
  await db.betaTesterRequest.delete({ where: { id: request.id } });
  revalidatePath(`/startup/${request.program.startup.id}/beta-testers`);
  return { success: true };
}

export async function clearOldBetaRequests(startupId: string) {
  const user = await founderSession();
  if (!user) return { error: "Sign in with a verified founder account to remove requests." };
  const result = await db.betaTesterRequest.updateMany({
    where: { program: { startupId, startup: { founderId: user.id } }, status: "PENDING", createdAt: { lt: daysAgo(30) } },
    data: { name: null, email: null, message: null, status: "DECLINED", reviewedAt: new Date() },
  });
  revalidatePath(`/startup/${startupId}/beta-testers`);
  return { success: true as const, removed: result.count };
}
