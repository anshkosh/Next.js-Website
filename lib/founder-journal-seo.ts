export function founderEntrySlug(title: string) {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80).replace(/^-+|-+$/g, "") || "founder-story";
}
export function founderEntryPath(entry: { id: string; title: string }) {
  return `/founder-journal/${encodeURIComponent(entry.id)}/${founderEntrySlug(entry.title)}`;
}
export function founderEntryDescription(body: string, startupName: string) {
  const text = body.replace(/\[(Image|Video)\]/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text : `A founder story from ${startupName} on Anshkosh.`.slice(0, 160);
}
