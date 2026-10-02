"use server";
import { ownsPitchDeck } from "@/lib/validators/pitch-deck.schema";
import { mergeStartupMetadata } from "@/lib/startup-metadata";
import { logger } from "@/lib/logger";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createStartupSchema,
  updateStartupSchema,
} from "@/lib/validators/startup.schema";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { revalidatePath } from "next/cache";
import { notificationQueue } from "@/lib/jobs/queues";
import { getSettingValue } from "@/app/actions/settings.actions";

export async function createStartup(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    if (!session.user.emailVerified) {
      return { error: "Please verify your email to create a startup." };
    }

    // Check configurable limit from app settings (admin-controlled)
    const limitSetting = await getSettingValue("max_startups_per_user", "1");
    const limit = Math.max(1, parseInt(limitSetting, 10) || 1);

    const startupCount = await db.startup.count({
      where: { founderId: session.user.id },
    });

    if (startupCount >= limit) {
      return {
        error: `You can only create up to ${limit} startup${limit === 1 ? "" : "s"}.`,
      };
    }

    // Parse form data
    const rawData = {
      name: formData.get("name"),
      tagline: formData.get("tagline"),
      description:
        formData.get("description") ||
        "Draft description - please update this before submitting. It needs to be at least fifty characters long to pass validation.",
      websiteUrl: formData.get("websiteUrl") || "https://example.com",
      categoryId: formData.get("categoryId"),
      founderName: formData.get("founderName") || session.user.name,
      logoUrl: formData.get("logoUrl") || undefined,
      videoUrl: formData.get("videoUrl") || undefined,
      galleryImages: formData.getAll("galleryImages").filter(Boolean),
      // Founder contact
      startupPhone: formData.get("startupPhone") || undefined,
      // Core Proposition
      problemStatement: formData.get("problemStatement") || undefined,
      solutionStatement: formData.get("solutionStatement") || undefined,
      targetAudience: formData.get("targetAudience") || undefined,
      prototypeStatus: formData.get("prototypeStatus") || undefined,
      tractionEvidence: formData.get("tractionEvidence") || undefined,
      metadata: {
        twitterUrl: formData.get("twitterUrl") || undefined,
        linkedinUrl: formData.get("linkedinUrl") || undefined,
        city: formData.get("city") || undefined,
        pitchDeckUrl: formData.has("pitchDeckUrl") ? formData.get("pitchDeckUrl") : undefined,
        foundedYear: formData.get("foundedYear")
          ? parseInt(formData.get("foundedYear") as string, 10)
          : undefined,
        features: formData.get("features")
          ? JSON.parse(formData.get("features") as string)
          : undefined,
      },
    };

    const validatedData = createStartupSchema.safeParse(rawData);

    if (!validatedData.success) {
      const errorMsg = validatedData.error.issues
        .map((issue) => {
          const field = String(
            issue.path[issue.path.length - 1] || issue.path[0],
          );
          return `• ${field}: ${issue.message}`;
        })
        .join("\n");
      return {
        error: `Please fix the following errors:\n${errorMsg}`,
        details: validatedData.error.flatten().fieldErrors,
      };
    }

    const { data } = validatedData;
    if (data.metadata?.pitchDeckUrl && !ownsPitchDeck(data.metadata.pitchDeckUrl, session.user.id)) {
      return { error: "Please upload your own PDF pitch deck." };
    }
    const slug = await generateUniqueSlug(data.name, async (candidate) => {
      const existing = await db.startup.findUnique({
        where: { slug: candidate },
      });
      return existing !== null;
    });

    const startup = await db.startup.create({
      data: {
        ...data,
        founderName: data.founderName || session.user.name || "Unknown Founder",
        slug,
        founderId: session.user.id,
        status: "DRAFT",
      },
    });

    revalidatePath("/dashboard");
    return { data: startup };
  } catch (error) {
    logger.error("Create startup error:", error);
    return { error: "Internal server error" };
  }
}

export async function updateStartup(formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const rawData = {
      id: formData.get("id"),
      name: formData.get("name") || undefined,
      tagline: formData.get("tagline") || undefined,
      description: formData.get("description") || undefined,
      websiteUrl: formData.get("websiteUrl") || undefined,
      categoryId: formData.get("categoryId") || undefined,
      founderName: formData.get("founderName") || undefined,
      logoUrl: formData.has("logoUrl") ? formData.get("logoUrl") : undefined,
      videoUrl: formData.get("videoUrl") || undefined,
      galleryImages: formData.has("galleryImages")
        ? formData.getAll("galleryImages").filter(Boolean)
        : undefined,
      // Founder contact
      startupPhone: formData.get("startupPhone") || undefined,
      // Core Proposition
      problemStatement: formData.get("problemStatement") || undefined,
      solutionStatement: formData.get("solutionStatement") || undefined,
      targetAudience: formData.get("targetAudience") || undefined,
      prototypeStatus: formData.get("prototypeStatus") || undefined,
      tractionEvidence: formData.get("tractionEvidence") || undefined,
      metadata: {
        twitterUrl: formData.get("twitterUrl") || undefined,
        linkedinUrl: formData.get("linkedinUrl") || undefined,
        city: formData.get("city") || undefined,
        pitchDeckUrl: formData.has("pitchDeckUrl") ? formData.get("pitchDeckUrl") : undefined,
        foundedYear: formData.get("foundedYear")
          ? parseInt(formData.get("foundedYear") as string, 10)
          : undefined,
        features: formData.get("features")
          ? JSON.parse(formData.get("features") as string)
          : undefined,
      },
    };

    // Remove undefined values so partial schema works correctly
    Object.keys(rawData).forEach(
      (key) =>
        (rawData as any)[key] === undefined && delete (rawData as any)[key],
    );

    const validatedData = updateStartupSchema.safeParse(rawData);

    if (!validatedData.success) {
      const errorMsg = validatedData.error.issues
        .map((issue) => {
          const field = String(
            issue.path[issue.path.length - 1] || issue.path[0],
          );
          return `• ${field}: ${issue.message}`;
        })
        .join("\n");
      return {
        error: `Please fix the following errors:\n${errorMsg}`,
        details: validatedData.error.flatten().fieldErrors,
      };
    }

    const { data } = validatedData;
    if (data.metadata?.pitchDeckUrl && !ownsPitchDeck(data.metadata.pitchDeckUrl, session.user.id)) {
      return { error: "Please upload your own PDF pitch deck." };
    }

    const existingStartup = await db.startup.findUnique({
      where: { id: data.id },
    });

    if (!existingStartup) {
      return { error: "Startup not found" };
    }

    if (existingStartup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    if (!["DRAFT", "REJECTED", "LIVE"].includes(existingStartup.status)) {
      return { error: "Cannot edit startup in its current state" };
    }

    const { id, ...updateData } = data;

    const isSubmitting =
      existingStartup.status === "LIVE" ||
      existingStartup.status === "REJECTED";

    const updatedStartup = await db.startup.update({
      where: { id },
      data: {
        ...updateData,
        metadata: mergeStartupMetadata(existingStartup.metadata, updateData.metadata),
        status: isSubmitting ? "PENDING_REVIEW" : existingStartup.status,
      },
      include: { founder: true, category: true },
    });

    if (isSubmitting) {
      await notificationQueue.add("new_submission", {
        startupName: updatedStartup.name,
        founderName: updatedStartup.founder.name,
        category: updatedStartup.category.name,
      });
    }

    revalidatePath("/dashboard");
    return { data: updatedStartup };
  } catch (error) {
    logger.error("Update startup error:", error);
    return { error: "Internal server error" };
  }
}

export async function deleteStartup(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const existingStartup = await db.startup.findUnique({
      where: { id },
    });

    if (!existingStartup) {
      return { error: "Startup not found" };
    }

    if (existingStartup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.startup.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    logger.error("Delete startup error:", error);
    return { error: "Internal server error" };
  }
}

export async function submitForReview(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const existingStartup = await db.startup.findUnique({
      where: { id },
    });

    if (!existingStartup) {
      return { error: "Startup not found" };
    }

    if (existingStartup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    if (
      existingStartup.status !== "DRAFT" &&
      existingStartup.status !== "REJECTED"
    ) {
      return { error: "Can only submit DRAFT or REJECTED startups" };
    }

    if (
      !existingStartup.description ||
      existingStartup.description.includes(
        "Draft description - please update this",
      ) ||
      existingStartup.description.length < 10
    ) {
      return {
        error:
          "Please provide a valid description (at least 10 characters) before submitting.",
      };
    }

    if (
      !existingStartup.websiteUrl ||
      existingStartup.websiteUrl === "https://example.com"
    ) {
      return { error: "Please provide a valid website URL before submitting." };
    }

    if (!existingStartup.logoUrl) {
      return { error: "Please upload a startup logo before submitting." };
    }

    if (
      !existingStartup.startupPhone ||
      existingStartup.startupPhone.length !== 10
    ) {
      return {
        error:
          "Please provide a valid 10-digit phone number before submitting.",
      };
    }

    const metadata = existingStartup.metadata as any;
    if (!metadata || !metadata.city) {
      return { error: "Please provide your City before submitting." };
    }

    if (!metadata || !metadata.foundedYear) {
      return { error: "Please provide the Founded Year before submitting." };
    }

    // Core Proposition gates
    if (
      !existingStartup.problemStatement ||
      existingStartup.problemStatement.length < 100
    ) {
      return {
        error:
          "Please complete the Problem Statement (min 100 characters) before submitting.",
      };
    }
    if (
      !existingStartup.solutionStatement ||
      existingStartup.solutionStatement.length < 100
    ) {
      return {
        error:
          "Please complete the Solution Statement (min 100 characters) before submitting.",
      };
    }
    if (!existingStartup.targetAudience) {
      return {
        error: "Please describe your Target Audience before submitting.",
      };
    }
    if (!existingStartup.prototypeStatus) {
      return {
        error: "Please select your Prototype / Build Status before submitting.",
      };
    }

    const updatedStartup = await db.startup.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        publishedAt: existingStartup.publishedAt ? undefined : new Date(), // Set publishedAt if first submission
      },
      include: { founder: true, category: true },
    });

    await notificationQueue.add("new_submission", {
      startupName: updatedStartup.name,
      founderName: updatedStartup.founder.name,
      category: updatedStartup.category.name,
    });

    revalidatePath("/dashboard");
    return { data: updatedStartup };
  } catch (error) {
    logger.error("Submit for review error:", error);
    return { error: "Internal server error" };
  }
}
