import { publicStartupWhere } from "./startup-visibility";
import type { Prisma } from "@prisma/client";

// Published fields are approved; pending revisions never enter this projection.
export const wallStartupWhere = {
  ...publicStartupWhere, wallOptIn: true,
  OR: [{ wallImageUrl: { not: "" } }, { logoUrl: { not: "" } }],
} satisfies Prisma.StartupWhereInput;

export function orderWallTiles<T extends { id: string; featuredEntry: { sortOrder: number; featuredUntil: Date | null } | null }>(rows: T[], now = new Date()) {
  const active = (row: T) => !!row.featuredEntry && (!row.featuredEntry.featuredUntil || row.featuredEntry.featuredUntil > now);
  return [...rows].sort((a, b) => Number(active(b)) - Number(active(a)) ||
    Number(active(b) && !!b.featuredEntry?.featuredUntil) - Number(active(a) && !!a.featuredEntry?.featuredUntil) ||
    (active(a) && active(b) ? a.featuredEntry!.sortOrder - b.featuredEntry!.sortOrder : 0));
}
