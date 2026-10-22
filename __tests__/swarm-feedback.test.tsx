import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ get: vi.fn(), create: vi.fn(), edit: vi.fn(), remove: vi.fn(), signOut: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("@/app/actions/update.actions", () => ({ getUpdates: m.get, createUpdate: m.create, editUpdate: m.edit, deleteUpdate: m.remove }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: m.signOut } }));
vi.mock("@/lib/browser-navigation", () => ({ navigateAfterSignOut: () => m.replace("/login") }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: m.replace, refresh: m.refresh }) }));
// A plain image exposes load/error events without Next's image loader in this DOM test.
// eslint-disable-next-line @next/next/no-img-element
vi.mock("next/image", () => ({ default: function MockImage({ src, alt, onError }: { src: string; alt: string; onError: () => void }) { return <img src={src} alt={alt} onError={onError} />; } }));
import UpdateManager from "@/components/startup/UpdateManager";
import Logout from "@/components/auth/Logout";
import JournalCover from "@/components/journal/JournalCover";
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.resetAllMocks(); vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  m.get.mockResolvedValue({ data: [] }); m.signOut.mockResolvedValue({ error: null });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const button = (text: string) => [...container.querySelectorAll("button")].find(item => item.textContent?.includes(text))!;
async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => { Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value); element.dispatchEvent(new Event("input", { bubbles: true })); });
}
async function writeUpdate() {
  await act(async () => root.render(<UpdateManager startupId="startup" />));
  await act(async () => button("Post a New Update").click());
  await fill(container.querySelector('input[type="text"]')!, "A progress update");
  await fill(container.querySelector("textarea")!, "Our pilot reached another milestone.");
}
it("announces a published update and keeps it in the visible list", async () => {
  m.create.mockResolvedValue({ data: { id: "saved", title: "A progress update", body: "Our pilot reached another milestone.", createdAt: new Date() } });
  await writeUpdate(); await act(async () => button("Publish Update").click());
  expect(container.querySelector('[role="status"]')?.textContent).toBe("Update published successfully.");
  expect(container.querySelector("h4")?.textContent).toBe("A progress update");
});
it("recovers from a lost update response with the draft intact", async () => {
  m.create.mockRejectedValue(new Error("network")); await writeUpdate();
  await act(async () => button("Publish Update").click());
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("check your updates");
  expect(container.querySelector("textarea")?.value).toContain("another milestone");
  expect(button("Publish Update").disabled).toBe(false);
});
it("signs out through the auth client and clears the displayed session", async () => {
  await act(async () => root.render(<Logout />));
  expect(m.signOut).toHaveBeenCalledOnce(); expect(m.replace).toHaveBeenCalledWith("/login");
});
it("offers retry when sign-out fails", async () => {
  m.signOut.mockResolvedValueOnce({ error: { message: "unavailable" } });
  await act(async () => root.render(<Logout />)); expect(m.replace).not.toHaveBeenCalled();
  expect(container.querySelector('[role="alert"]')).not.toBeNull();
  await act(async () => button("Try again").click()); expect(m.replace).toHaveBeenCalledWith("/login");
});
it("shows a recoverable cover fallback instead of a blank image", async () => {
  await act(async () => root.render(<JournalCover src="/cover.webp" title="Story" />));
  await act(async () => container.querySelector("img")!.dispatchEvent(new Event("error")));
  expect(container.querySelector('[role="status"]')?.textContent).toContain("could not load");
  await act(async () => button("Retry cover image").click());
  expect(container.querySelector('img[alt="Story"]')).not.toBeNull();
});
