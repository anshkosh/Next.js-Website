import { parseRecord } from "./founder-toolkit";

export const CARD_THEMES = {
  charcoal: { label: "Charcoal", background: "#111827", foreground: "#ffffff", muted: "#d1d5db", accent: "#ff7642" },
  paper: { label: "Paper", background: "#ffffff", foreground: "#111827", muted: "#4b5563", accent: "#a23510" },
  coral: { label: "Coral", background: "#a23510", foreground: "#ffffff", muted: "#ffe1d5", accent: "#ffffff" },
} as const;
export const CARD_BADGES = ["Launching soon", "Now live", "Looking for beta testers"] as const;
export type CardSettings = { theme: keyof typeof CARD_THEMES; format: "landscape" | "square"; badge: typeof CARD_BADGES[number] };
export function readCardSettings(raw: string): CardSettings {
  const data = parseRecord(raw);
  return { theme: Object.hasOwn(CARD_THEMES, String(data.theme)) ? data.theme as CardSettings["theme"] : "charcoal",
    format: data.format === "square" ? "square" : "landscape",
    badge: CARD_BADGES.includes(data.badge as CardSettings["badge"]) ? data.badge as CardSettings["badge"] : CARD_BADGES[0] };
}

// Split long words too, so a domain or a name without spaces cannot overflow.
export function canvasLines(ctx: Pick<CanvasRenderingContext2D, "measureText">, text: string, width: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/); const lines: string[] = []; let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
    if (line) { lines.push(line); line = ""; }
    for (const char of Array.from(word)) {
      if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = ""; }
      line += char;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines; let last = lines[maxLines - 1];
    while (last && ctx.measureText(last + "…").width > width) last = Array.from(last).slice(0, -1).join("");
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}
