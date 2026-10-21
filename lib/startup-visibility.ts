import type { Prisma } from "@prisma/client";

// Founder mode controls public visibility without changing moderation status or
// deleting saved work. Owner/reviewer management access is checked separately.
export const publicStartupWhere = {
  status: "LIVE",
  founder: { founderMode: true },
} satisfies Prisma.StartupWhereInput;
