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
    (errors[key] ??= []).push(startupIssueMessage(key, issue));
  }
  return errors;
}

function startupIssueMessage(key: string, issue: z.core.$ZodIssue) {
  const tooSmall = issue.code === "too_small";
  const tooBig = issue.code === "too_big";
  if (key === "categoryId") return "Choose a category from the list.";
  if (key === "name") return tooSmall
    ? "Enter a startup name with at least 2 characters."
    : tooBig ? "Keep the startup name to 100 characters or fewer." : "Enter a valid startup name.";
  if (key === "tagline") return tooSmall
    ? "Write a tagline with at least 10 characters."
    : tooBig ? "Keep the tagline to 120 characters or fewer." : "Enter a valid tagline.";
  if (key === "description") return tooSmall
    ? "Write a description with at least 50 characters."
    : tooBig ? "Keep the description to 5,000 characters or fewer." : "Enter a valid description.";
  if (["websiteUrl", "twitterUrl", "linkedinUrl", "videoUrl"].includes(key)) {
    return "Enter a complete web address, such as https://example.com.";
  }
  if (key === "prototypeStatus") return "Choose your current build stage from the list.";
  if (key === "features" && tooBig) return "Use no more than 6 key features.";
  if (key === "galleryImages" && tooBig) return "Use no more than 4 gallery images.";
  const feature = /^features\.(\d+)\.(title|description)$/.exec(key);
  if (feature && tooSmall) return `Enter a ${feature[2]} for feature ${Number(feature[1]) + 1}.`;
  if (feature && tooBig) return `${feature[2] === "title" ? "Feature titles" : "Feature descriptions"} must be within the displayed character limit.`;
  return issue.message;
}

export function startupFieldLabel(key: string) {
  const feature = /^features\.(\d+)\.(title|description)$/.exec(key);
  if (feature) return `Feature ${Number(feature[1]) + 1} ${feature[2]}`;
  const labels: Record<string, string> = {
    name: "Startup name",
    tagline: "Tagline",
    categoryId: "Category",
    founderName: "Founder name",
    city: "City",
    description: "Description",
    problemStatement: "The problem",
    solutionStatement: "Solution and value proposition",
    targetAudience: "Target audience",
    tractionEvidence: "Proof points and traction",
    videoUrl: "Video demo URL",
    galleryImages: "Gallery images",
    features: "Key features",
    logoUrl: "Logo",
    websiteUrl: "Website",
    startupPhone: "Phone",
    foundedYear: "Founded year",
    pitchDeckUrl: "Pitch deck",
    prototypeStatus: "Build stage",
    twitterUrl: "X / Twitter URL",
    linkedinUrl: "LinkedIn URL",
  };
  return labels[key] || key.replace(/([A-Z])/g, " $1");
}
