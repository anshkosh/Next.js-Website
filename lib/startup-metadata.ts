import type { Prisma } from "@prisma/client";

// Do not erase source identifiers or metadata that is not editable in this form.
export function mergeStartupMetadata(existing: unknown, changes: Record<string, unknown> | undefined) {
  const previous = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  return { ...previous, ...Object.fromEntries(Object.entries(changes || {}).filter(([, value]) => value !== undefined)) } as Prisma.InputJsonObject;
}
