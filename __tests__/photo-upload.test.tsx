import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EditableImageUpload from "../components/startup/EditableImageUpload";

vi.mock("../components/startup/PhotoEditor", () => ({ default: ({ onCancel, onApply }: { onCancel: () => void; onApply: (file: File) => Promise<void> }) => {
  const [error, setError] = React.useState("");
  return <div role="dialog"><button type="button" onClick={onCancel}>Cancel crop</button><button type="button" onClick={() => onApply(new File(["edited"], "edited.webp", { type: "image/webp" })).catch(e => setError(e.message))}>Apply crop</button>{error && <p role="alert">{error}</p>}</div>;
} }));
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function select(file: File) {
  const input = container.querySelector('input[type="file"]')!;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  await act(async () => { input.dispatchEvent(new Event("change", { bubbles: true })); });
}
async function click(label: string) {
  const button = [...container.querySelectorAll("button")].find(button => button.textContent === label)!;
  await act(async () => button.click());
}
describe("photo upload flow", () => {
  it("does not upload until a crop is applied and cancel preserves the old photo", async () => {
    const changed = vi.fn(), busy = vi.fn(), fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await act(async () => root.render(<EditableImageUpload kind="gallery" label="Gallery image" value="/old.webp" onChange={changed} onBusyChange={busy} />));
    await select(new File(["photo"], "original.png", { type: "image/png" }));
    expect(container.querySelector('[role="dialog"]')).not.toBeNull(); expect(fetchMock).not.toHaveBeenCalled(); expect(busy).toHaveBeenLastCalledWith(true);
    await click("Cancel crop");
    expect(container.querySelector('[role="dialog"]')).toBeNull(); expect(changed).not.toHaveBeenCalled(); expect(busy).toHaveBeenLastCalledWith(false);
  });
  it("uploads edited output and reports completion", async () => {
    const changed = vi.fn(), busy = vi.fn(), fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ url: "/new.webp" }) });
    vi.stubGlobal("fetch", fetchMock);
    await act(async () => root.render(<EditableImageUpload kind="founder-photo" label="Founder photo" onChange={changed} onBusyChange={busy} />));
    await select(new File(["photo"], "original.png", { type: "image/png" })); await click("Apply crop");
    expect(fetchMock).toHaveBeenCalledWith("/api/uploads/founder-photo", expect.objectContaining({ method: "POST" }));
    expect((fetchMock.mock.calls[0][1].body as FormData).get("file")).toMatchObject({ name: "edited.webp", type: "image/webp" });
    expect(changed).toHaveBeenCalledWith("/new.webp"); expect(busy).toHaveBeenLastCalledWith(false);
  });
  it("retains the editor and original photo after upload failure", async () => {
    const changed = vi.fn(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "Try again" }) }));
    await act(async () => root.render(<EditableImageUpload kind="logo" label="Logo" value="/old.webp" onChange={changed} />));
    await select(new File(["photo"], "photo.jpg", { type: "image/jpeg" })); await click("Apply crop");
    expect(changed).not.toHaveBeenCalled(); expect(container.querySelector('[role="dialog"]')).not.toBeNull(); expect(container.querySelector('[role="alert"]')?.textContent).toBe("Try again");
  });
  it("rejects unsupported images before opening the editor", async () => {
    await act(async () => root.render(<EditableImageUpload kind="gallery" label="Gallery" onChange={vi.fn()} />));
    await select(new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }));
    expect(container.querySelector('[role="dialog"]')).toBeNull(); expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });
});
