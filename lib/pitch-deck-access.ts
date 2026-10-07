export function publicPitchDeck(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const record = metadata as Record<string, unknown>;
  // Legacy decks were explicitly public; new upload forms default to private.
  return record.pitchDeckVisibility !== "private" && typeof record.pitchDeckUrl === "string"
    ? record.pitchDeckUrl : null;
}

export function mayReadDeck(user: { id: string; role?: string | null; banned?: boolean | null; emailVerified?: boolean } | undefined, ownerId: string) {
  return Boolean(user && !user.banned && user.emailVerified &&
    (user.id === ownerId || user.role === "admin" || user.role === "reviewer"));
}
