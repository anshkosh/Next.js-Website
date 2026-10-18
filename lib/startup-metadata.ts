import type { Prisma } from "@prisma/client";

// Do not erase source identifiers or metadata that is not editable in this form.
export function mergeStartupMetadata(existing: unknown, changes: Record<string, unknown> | undefined) {
  const previous = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  return { ...previous, ...Object.fromEntries(Object.entries(changes || {}).filter(([, value]) => value !== undefined)) } as Prisma.InputJsonObject;
}

// Display/edit projection only. Keep mergeStartupMetadata for saving so legacy
// source identifiers and unrelated metadata are never silently erased.
export function startupMetadataFields(value: unknown) {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const text = (key: string) => typeof record[key] === "string" ? record[key] as string : "";
  const features = Array.isArray(record.features) ? record.features.flatMap(value => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const feature = value as Record<string, unknown>;
    if (typeof feature.title !== "string" || typeof feature.description !== "string") return [];
    return [{ icon: typeof feature.icon === "string" ? feature.icon : "Zap", title: feature.title, description: feature.description }];
  }) : [];
  return {
    twitterUrl: text("twitterUrl"), linkedinUrl: text("linkedinUrl"), city: text("city"),
    foundedYear: typeof record.foundedYear === "number" ? record.foundedYear : text("foundedYear"),
    pitchDeckUrl: text("pitchDeckUrl"), pitchDeckVisibility: text("pitchDeckVisibility"), features,
  };
}
