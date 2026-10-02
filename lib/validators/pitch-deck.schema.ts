import { z } from "zod";

export const MAX_PITCH_DECK_BYTES = 5 * 1024 * 1024;
export const pitchDeckUrlSchema = z.string().regex(
  /^\/api\/uploads\/serve\/pitch-decks\/[a-zA-Z0-9_-]{1,128}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/,
  "Please upload a PDF pitch deck",
).or(z.literal(""));

export function ownsPitchDeck(url: string, userId: string) {
  return pitchDeckUrlSchema.safeParse(url).success &&
    url.startsWith(`/api/uploads/serve/pitch-decks/${userId}/`);
}

export function validatePitchDeck(file: { name: string; type: string; size: number }, bytes?: Uint8Array) {
  if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) return "Choose a PDF file.";
  if (!file.size || file.size > MAX_PITCH_DECK_BYTES) return "The PDF must be between 1 byte and 5 MB.";
  if (bytes) {
    const header = new TextDecoder().decode(bytes.slice(0, 8));
    const trailer = new TextDecoder().decode(bytes.slice(-1024));
    if (!/^%PDF-(1\.[0-7]|2\.0)/.test(header) || !trailer.includes("%%EOF")) return "This file does not appear to be a valid PDF.";
  }
  return null;
}
