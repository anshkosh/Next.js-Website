import { Prisma, type Startup } from "@prisma/client";
import { updateStartupSchema } from "./validators/startup.schema";
import { mergeStartupMetadata } from "./startup-metadata";

export function revisionPatch(value: unknown, startupId: string) {
  const parsed = updateStartupSchema.parse({ ...(value as Record<string, unknown>), id: startupId });
  const { id, ...patch } = parsed;
  void id;
  return patch;
}

export async function savePublishedRevision(tx: Prisma.TransactionClient, startup: Startup, patch: ReturnType<typeof revisionPatch>) {
  // Lock the parent record: review and resubmission cannot overwrite each other.
  await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${startup.id} FOR UPDATE`;
  const current = await tx.startup.findUniqueOrThrow({ where: { id: startup.id } });
  if (current.founderId !== startup.founderId) throw new Error("Profile ownership changed. Reload before saving.");
  if (current.status !== "LIVE") throw new Error("This profile is no longer live. Reload before saving.");
  const previous = await tx.startupRevision.findUnique({ where: { startupId: startup.id } });
  const previousPatch: ReturnType<typeof revisionPatch> = previous ? revisionPatch(previous.data, startup.id) : {};
  const metadata = mergeStartupMetadata(current.metadata, mergeStartupMetadata(previousPatch.metadata, patch.metadata));
  const data = JSON.parse(JSON.stringify({ ...previousPatch, ...patch, metadata })) as Prisma.InputJsonObject;
  await tx.startupRevision.upsert({
    where: { startupId: startup.id },
    create: { startupId: startup.id, data },
    update: { data, status: "PENDING_REVIEW", notes: null },
  });
  // A privacy restriction/removal must take effect immediately, not after approval.
  if (patch.metadata?.pitchDeckVisibility === "private" || patch.metadata?.pitchDeckUrl === "") {
    await tx.startup.update({ where: { id: startup.id }, data: {
      metadata: mergeStartupMetadata(current.metadata, { pitchDeckVisibility: "private" }),
    } });
  }
  return current;
}
