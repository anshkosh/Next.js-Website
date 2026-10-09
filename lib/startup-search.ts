import type { Prisma } from "@prisma/client";

// Search only published profile data, including the public founding team.
// Account names, private emails and pending revisions are never queried.
export function startupSearchWhere(query: string): Prisma.StartupWhereInput {
  const contains = { contains: query.trim(), mode: "insensitive" as const };
  return {
    status: "LIVE",
    OR: [
      { name: contains }, { tagline: contains }, { description: contains },
      { founders: { some: { name: contains } } },
      { category: { name: contains } },
      { metadata: { path: ["city"], string_contains: query.trim(), mode: "insensitive" } },
    ],
  };
}
