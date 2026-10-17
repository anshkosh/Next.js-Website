import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Quill from "quill";
import QuillEditor from "../components/admin/QuillEditor";

let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function flush() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 40)); }); }
async function render(props: Parameters<typeof QuillEditor>[0]) {
  await act(async () => root.render(<StrictMode><QuillEditor {...props} /></StrictMode>));
  for (let attempt = 0; attempt < 20 && !container.querySelector(".ql-editor"); attempt++) await flush();
}
function editor() { return Quill.find(container.querySelector(".ql-container")!) as Quill; }

it("uses one admin-format toolbar in Strict Mode and rehydrates bold text", async () => {
  await render({ value: { ops: [{ insert: "Saved bold text", attributes: { bold: true } }, { insert: "\n" }] }, ariaLabel: "Your entry" });
  expect(container.querySelectorAll(".ql-toolbar")).toHaveLength(1);
  for (const control of [".ql-bold", ".ql-italic", ".ql-link", ".ql-image", ".ql-video", ".ql-blockquote"]) expect(container.querySelector(control)).not.toBeNull();
  expect(container.querySelector(".ql-editor strong")?.textContent).toBe("Saved bold text");
  expect(container.querySelector('[role="textbox"]')?.getAttribute("aria-label")).toBe("Your entry");
});
it("updates when another entry is selected and clears after resetting a saved entry", async () => {
  await render({ value: { ops: [{ insert: "First entry\n" }] } });
  await render({ value: { ops: [{ insert: "Second entry", attributes: { italic: true } }, { insert: "\n" }] } });
  expect(container.querySelector(".ql-editor em")?.textContent).toBe("Second entry");
  expect(container.textContent).not.toContain("First entry");
  await render({ value: null });
  expect(editor().getText().trim()).toBe("");
});
it("calls the current callback after a rerender and respects read-only state", async () => {
  const first = vi.fn(); const latest = vi.fn();
  await render({ onChange: first });
  await render({ onChange: latest });
  await act(async () => { editor().setText("New founder entry", "user"); });
  expect(latest).toHaveBeenCalledWith(expect.objectContaining({ ops: expect.any(Array) }), expect.stringContaining("New founder entry"), "New founder entry\n");
  expect(first).not.toHaveBeenCalled();
  await render({ onChange: latest, readOnly: true });
  expect(editor().isEnabled()).toBe(false);
  expect((container.querySelector(".ql-bold") as HTMLButtonElement).disabled).toBe(true);
});
