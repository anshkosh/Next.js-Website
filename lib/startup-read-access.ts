import type { Prisma } from "@prisma/client";
import { publicStartupWhere } from "./startup-visibility";

export function startupReadWhere(user?: { id: string; emailVerified?: boolean; banned?: boolean | null; role?: string | null } | null): Prisma.StartupWhereInput {
  if (!user?.emailVerified || user.banned) return publicStartupWhere;
  if (["admin", "reviewer"].includes(user.role ?? "")) return {};
  return { OR: [publicStartupWhere, { founderId: user.id }] };
}
