import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({ changePassword: vi.fn() }));
vi.mock("@/lib/auth-client", () => ({ authClient: api }));
import AccountSecuritySettings from "@/components/account/AccountSecuritySettings";

let root: Root, host: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  api.changePassword.mockReset().mockResolvedValue({});
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
async function mount(hasPassword = true) {
  await act(async () => root.render(<AccountSecuritySettings email="member@example.test" emailVerified hasPassword={hasPassword} />));
}
async function fill(id: string, value: string) {
  const input = host.querySelector<HTMLInputElement>(`#${id}`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit() {
  await act(async () => host.querySelector("#change-password form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
}
it("requires matching new passwords before requesting a change", async () => {
  await mount(); await fill("new-password", "NewPassword123!"); await fill("confirm-password", "Different123!"); await submit();
  expect(api.changePassword).not.toHaveBeenCalled();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("do not match");
});
it("passes the current password to auth, revokes other sessions, and clears credentials on success", async () => {
  await mount(); await fill("current-password", "OldPassword123!"); await fill("new-password", "NewPassword123!"); await fill("confirm-password", "NewPassword123!"); await submit();
  expect(api.changePassword).toHaveBeenCalledWith({ currentPassword: "OldPassword123!", newPassword: "NewPassword123!", revokeOtherSessions: true });
  expect(host.textContent).toContain("Password updated. Your other sessions have been signed out.");
  for (const input of host.querySelectorAll<HTMLInputElement>('#change-password input')) expect(input.value).toBe("");
});
it("shows an auth failure without reporting success or clearing the entered values", async () => {
  api.changePassword.mockResolvedValue({ error: { message: "Current password is incorrect." } });
  await mount(); await fill("current-password", "WrongPassword123!"); await fill("new-password", "NewPassword123!"); await fill("confirm-password", "NewPassword123!"); await submit();
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("Current password is incorrect.");
  expect(host.textContent).not.toContain("Password updated.");
  expect(host.querySelector<HTMLInputElement>("#new-password")!.value).toBe("NewPassword123!");
});
it("offers a recovery-email path for Google-only accounts", async () => {
  await mount(false);
  expect(host.querySelector("#change-password form")).toBeNull();
  expect(host.querySelector('#change-password a[href="/forgot-password"]')?.textContent).toBe("Set password by email");
});
