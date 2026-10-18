import type { Prisma } from "@prisma/client";

export function startupReadWhere(user?: { id: string; emailVerified?: boolean; banned?: boolean | null; role?: string | null } | null): Prisma.StartupWhereInput {
  if (!user?.emailVerified || user.banned) return { status: "LIVE" };
  if (["admin", "reviewer"].includes(user.role ?? "")) return {};
  return { OR: [{ status: "LIVE" }, { founderId: user.id }] };
}
