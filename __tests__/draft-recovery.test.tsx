import { act, useLayoutEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { useDraftRecovery, readDraft } from "../components/startup/useDraftRecovery";

let root: Root, host: HTMLDivElement;
let draft: ReturnType<typeof useDraftRecovery<{ name: string }>>;
let restore: ReturnType<typeof vi.fn<(value: { name: string }) => void>>;
function Harness({ name, account = "one" }: { name: string; account?: string }) {
  const current = useDraftRecovery(`draft:${account}`, { name }, restore);
  useLayoutEffect(() => { draft = current; });
  return <div />;
}
beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear(); vi.useFakeTimers(); restore = vi.fn();
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });
it("writes a recovery copy without submitting and warns when leaving", async () => {
  await act(async () => root.render(<Harness name="Original" />));
  act(() => root.render(<Harness name="Changed" />));
  act(() => vi.advanceTimersByTime(400));
  expect(readDraft(window.localStorage.getItem("draft:one"))).toEqual({ name: "Changed" });
  const event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  act(() => draft.markSaved());
  expect(window.localStorage.getItem("draft:one")).toBeNull();
});
it("offers restoration without silently overwriting newer server data", async () => {
  window.localStorage.setItem("draft:one", JSON.stringify({ version: 1, savedAt: Date.now(), value: { name: "Unfinished" } }));
  await act(async () => root.render(<Harness name="Published" />));
  expect(restore).not.toHaveBeenCalled(); expect(draft.recovery).toEqual({ name: "Unfinished" });
  act(() => draft.restoreDraft()); expect(restore).toHaveBeenCalledWith({ name: "Unfinished" });
});
it("scopes recovery by account", async () => {
  window.localStorage.setItem("draft:one", JSON.stringify({ version: 1, savedAt: Date.now(), value: { name: "Private" } }));
  await act(async () => root.render(<Harness name="Other" account="two" />)); expect(draft.recovery).toBeNull();
});
it("ignores expired, malformed and unknown-version copies", () => {
  for (const entry of ["junk", JSON.stringify({ version: 2, savedAt: Date.now(), value: {} }), JSON.stringify({ version: 1, savedAt: Date.now() - 8 * 86400000, value: {} })]) expect(readDraft(entry)).toBeNull();
});
it("flushes a just-typed change when the page is hidden", async () => {
  await act(async () => root.render(<Harness name="Original" />)); act(() => root.render(<Harness name="Last keystroke" />));
  act(() => window.dispatchEvent(new Event("pagehide")));
  expect(readDraft(window.localStorage.getItem("draft:one"))).toEqual({ name: "Last keystroke" });
});

it("silently removes a recovery copy identical to the current server data", async () => {
  window.localStorage.setItem("draft:one", JSON.stringify({ version: 1, savedAt: Date.now(), value: { name: "Published" } }));
  await act(async () => root.render(<Harness name="Published" />));
  expect(draft.recovery).toBeNull(); expect(window.localStorage.getItem("draft:one")).toBeNull();
});
