import type { StartupFounder } from "@prisma/client";

export async function fetchStartupFounders(startupId: string, signal: AbortSignal) {
  const response = await fetch(`/api/startups/${encodeURIComponent(startupId)}/founders`, { cache: "no-store", signal });
  const result: { data?: Pick<StartupFounder, "id" | "name" | "role" | "photoUrl" | "linkedinUrl" | "twitterUrl" | "sortOrder">[]; error?: string } = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not load the team.");
  return result;
}
