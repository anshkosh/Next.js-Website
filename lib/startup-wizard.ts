import type { Startup } from "@prisma/client";
import type { z } from "zod";
import { startupMetadataFields } from "./startup-metadata";

export function wizardStep(value: unknown) {
  const step = typeof value === "string" ? Number(value) : 1;
  return Number.isInteger(step) && step >= 1 && step <= 6 ? step : 1;
}

export function wizardFields(startup: Startup | null) {
  const metadata = startupMetadataFields(startup?.metadata);
  return {
    name: startup?.name ?? "",
    tagline: startup?.tagline ?? "",
    categoryId: startup?.categoryId ?? "",
    founderName: startup?.founderName ?? "",
    description: startup?.description ?? "",
    websiteUrl: startup?.websiteUrl ?? "",
    logoUrl: startup?.logoUrl ?? "",
    twitterUrl: metadata.twitterUrl,
    linkedinUrl: metadata.linkedinUrl,
    city: metadata.city,
    foundedYear: String(metadata.foundedYear || ""),
    videoUrl: startup?.videoUrl ?? "",
    pitchDeckUrl: metadata.pitchDeckUrl,
    pitchDeckVisibility: metadata.pitchDeckVisibility || "private",
    galleryImages: startup?.galleryImages ?? [],
    features: metadata.features,
    startupPhone: startup?.startupPhone ?? "",
    problemStatement: startup?.problemStatement ?? "",
    solutionStatement: startup?.solutionStatement ?? "",
    targetAudience: startup?.targetAudience ?? "",
    prototypeStatus: startup?.prototypeStatus ?? "",
    tractionEvidence: startup?.tractionEvidence ?? "",
  };
}

export function startupFieldErrors(issues: z.core.$ZodIssue[]) {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const path =
      issue.path[0] === "metadata" ? issue.path.slice(1) : issue.path;
    const key = path.join(".") || "form";
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export function startupFieldLabel(key: string) {
  const feature = /^features\.(\d+)\.(title|description)$/.exec(key);
  if (feature) return `Feature ${Number(feature[1]) + 1} ${feature[2]}`;
  const labels: Record<string, string> = {
    categoryId: "Category",
    logoUrl: "Logo",
    websiteUrl: "Website",
    startupPhone: "Phone",
    foundedYear: "Founded year",
    pitchDeckUrl: "Pitch deck",
    problemStatement: "Problem",
    solutionStatement: "Solution",
    prototypeStatus: "Build stage",
    targetAudience: "Audience",
    twitterUrl: "X / Twitter URL",
    linkedinUrl: "LinkedIn URL",
  };
  return labels[key] || key.replace(/([A-Z])/g, " $1");
}
