import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: m.refresh }) }));
vi.mock("next/dynamic", () => ({ default: () => function MockQuill({ value, onChange }: { value?: { ops: { insert: string }[] }; onChange: (delta: unknown, html: string, text: string) => void }) {
  return <textarea aria-label="Your entry" value={value?.ops.map(op => op.insert).join("").trimEnd() ?? ""} onChange={event => onChange({ ops: [{ insert: `${event.target.value}\n` }] }, "", event.target.value)} />;
} }));
vi.mock("@/app/actions/founder-journal.actions", () => ({ saveFounderEntry: m.save, deleteFounderEntry: m.remove }));
import FounderJournal from "../components/dashboard/FounderJournal";
let root: Root; let container: HTMLDivElement;
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); container = document.createElement("div"); document.body.append(container); root = createRoot(container); m.save.mockResolvedValue({ success: true }); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const button = (text: string) => [...container.querySelectorAll("button")].find(item => item.textContent === text)!;
async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => { Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value); element.dispatchEvent(new Event("input", { bubbles: true })); });
}
async function mount() { await act(async () => root.render(<FounderJournal entries={[]} startups={[{ id: "owned", name: "My startup", status: "LIVE" }]} />)); }
async function write() {
  await fill(container.querySelector<HTMLInputElement>("#entry-title")!, "An honest reflection");
  await fill(container.querySelector<HTMLTextAreaElement>("textarea")!, "Private thoughts I want to keep.");
}
async function submit() { await act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }); }

it("starts private and resets to private after saving; milestone completion is explicit", async () => {
  await mount(); expect(container.querySelector<HTMLInputElement>('input[value="PRIVATE"]')!.checked).toBe(true);
  expect(container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.disabled).toBe(true);
  await write(); await submit();
  expect(m.save).toHaveBeenCalledWith(null, expect.objectContaining({ visibility: "PRIVATE", startupId: null, milestoneDone: false }));
  expect(container.querySelector<HTMLInputElement>("#entry-title")!.value).toBe("");
  expect(container.querySelector<HTMLInputElement>('input[value="PRIVATE"]')!.checked).toBe(true);
  expect(container.textContent).toContain("Private entry saved. Only you can view it.");
});
it("keeps unsaved text when saving fails", async () => {
  m.save.mockResolvedValue({ error: "Try again" }); await mount(); await write(); await submit();
  expect(container.querySelector<HTMLInputElement>("#entry-title")!.value).toBe("An honest reflection");
  expect(container.querySelector("textarea")!.value).toBe("Private thoughts I want to keep.");
  expect(container.querySelector('[role="alert"]')!.textContent).toBe("Try again"); expect(m.refresh).not.toHaveBeenCalled();
});
it("requires a selected live startup before enabling publication and names that startup in the disclosure", async () => {
  await mount(); await write();
  await act(async () => container.querySelector<HTMLInputElement>('input[value="PUBLIC"]')!.click());
  expect(button("Submit for review").disabled).toBe(true);
  await act(async () => { const select = container.querySelectorAll("select")[1]; select.value = "owned"; select.dispatchEvent(new Event("change", { bubbles: true })); });
  expect(button("Submit for review").disabled).toBe(false);
  expect(container.textContent).toContain("Public entries for My startup require review");
  await submit();
  expect(m.save).toHaveBeenCalledWith(null, expect.objectContaining({ visibility: "PUBLIC", startupId: "owned" }));
  expect(container.querySelector<HTMLInputElement>('input[value="PRIVATE"]')!.checked).toBe(true);
});
it("adds optional weekly prompts without replacing an existing entry", async () => {
  await mount(); await write();
  await act(async () => { const select = container.querySelector("select")!; select.value = "WEEKLY"; select.dispatchEvent(new Event("change", { bubbles: true })); });
  expect(container.querySelector("textarea")!.value).toBe("Private thoughts I want to keep.");
  await act(async () => button("Add prompts to my entry").click());
  expect(container.querySelector("textarea")!.value).toContain("Private thoughts I want to keep.\n\nWins this week");
});
