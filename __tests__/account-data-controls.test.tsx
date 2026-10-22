import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ request: vi.fn(), erase: vi.fn(), signOut: vi.fn(), getSession: vi.fn() }));
vi.mock("@/app/actions/account-privacy.actions", () => ({ requestAccountPrivacyCode: m.request, deleteMyAccount: m.erase }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: m.signOut, getSession: m.getSession } }));
import AccountDataSettings from "@/components/account/AccountDataSettings";
import AccountDeletionConfirmation from "@/components/account/AccountDeletionConfirmation";
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.resetAllMocks();
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function mount(canDelete = true, emailVerified = true) { await act(async () => root.render(<AccountDataSettings canDelete={canDelete} emailVerified={emailVerified} />)); }
async function fill(id: string, value: string) {
  const input = host.querySelector<HTMLInputElement>(`#${id}`)!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
}
async function submit() { await act(async () => host.querySelector("#delete-account form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); }
it("requires exact final confirmation before invoking the destructive action", async () => {
  await mount(); await fill("deletion-confirmation-code", "a".repeat(32)); await fill("delete-confirmation", "delete"); await submit();
  expect(m.erase).not.toHaveBeenCalled(); expect(m.signOut).not.toHaveBeenCalled(); expect(host.textContent).toContain("Type DELETE to confirm.");
});
it("does not claim deletion or sign out on a failed confirmation", async () => {
  m.erase.mockResolvedValue({ error: "The code is invalid or expired." });
  await mount(); await fill("delete-confirmation", "DELETE"); await fill("deletion-confirmation-code", "a".repeat(32)); await submit();
  expect(m.erase).toHaveBeenCalledWith({ code: "a".repeat(32), confirmation: "DELETE" });
  expect(host.textContent).toContain("The code is invalid or expired."); expect(host.textContent).not.toContain("Your account has been deleted"); expect(m.signOut).not.toHaveBeenCalled();
});
it("shows the public receipt and refreshes revoked cookies without forcing a valid account to sign out", async () => {
  m.getSession.mockResolvedValue({ data: null });
  await act(async () => root.render(<AccountDeletionConfirmation />));
  expect(m.getSession).toHaveBeenCalledWith({ query: { disableCookieCache: true } });
  expect(m.signOut).not.toHaveBeenCalled();
  expect(host.textContent).toContain("Your account has been deleted"); expect(host.textContent).toContain("Upload removal is queued");
});
it("offers staff-assisted closure without exposing the destructive form for staff accounts", async () => {
  await mount(false); expect(host.querySelector("#delete-account form")).toBeNull(); expect(host.textContent).toContain("responsibility handover"); expect(host.textContent).toContain("Download your data");
});
it("requires email verification for both data controls", async () => {
  await mount(true, false); expect(host.textContent).toContain("Verify your email address");
  expect([...host.querySelectorAll("fieldset")].every(fieldset => fieldset.disabled)).toBe(true);
});
it("does not produce a download when the server rejects the code", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "The code is invalid or expired." }), { status: 400 })));
  await mount(); await fill("download-confirmation-code", "a".repeat(32));
  await act(async () => host.querySelector("#account-data > form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(host.textContent).toContain("The code is invalid or expired.");
  expect(host.textContent).not.toContain("Your account data download is ready.");
});
it("downloads only a confirmed response and releases its temporary browser URL", async () => {
  vi.useFakeTimers();
  const create = vi.fn().mockReturnValue("blob:private-download"); const revoke = vi.fn();
  vi.stubGlobal("URL", class extends URL { static createObjectURL = create; static revokeObjectURL = revoke; });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"account":{"id":"owner"}}', { headers: { "content-type": "application/json" } })));
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  await mount(); await fill("download-confirmation-code", "a".repeat(32));
  await act(async () => host.querySelector("#account-data > form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(click).toHaveBeenCalledOnce(); expect(create).toHaveBeenCalledOnce();
  expect(host.textContent).toContain("Your account data download is ready.");
  expect(host.querySelector<HTMLInputElement>("#download-confirmation-code")!.value).toBe("");
  vi.advanceTimersByTime(10000); expect(revoke).toHaveBeenCalledWith("blob:private-download");
});
