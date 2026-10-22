// Only free-tool drafts belong here. Never clear consent or unrelated browser data.
export const TOOL_DRAFT_KEYS = [
  "anshkosh-founder-details-v1", "anshkosh-founder-kit-v1", "anshkosh-mvp-v1",
  "anshkosh-validation-v1", "anshkosh-runway-v1", "anshkosh-launch-card-v1",
  "anshkosh-launch-checklist-v1", "anshkosh-submissions-v1",
] as const;
export const TOOL_DRAFT_CHANGED = "anshkosh-founder-draft-changed";
export const temporaryToolDrafts = new Map<string, string>();
export const toolDraftErrors = new Map<string, string>();

export function clearToolDrafts() {
  temporaryToolDrafts.clear();
  toolDraftErrors.clear();
  const failures: string[] = [];
  try {
    const keys = Object.keys(window.localStorage).filter(key => TOOL_DRAFT_KEYS.some(base => key === base || key.startsWith(`${base}:`)));
    for (const key of keys) {
      try { window.localStorage.removeItem(key); }
      catch { failures.push(key); temporaryToolDrafts.set(key, ""); }
    }
  } catch { failures.push("storage"); }
  window.dispatchEvent(new Event(TOOL_DRAFT_CHANGED));
  return failures.length === 0;
}
