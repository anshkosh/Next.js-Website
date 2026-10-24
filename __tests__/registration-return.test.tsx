import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  search: "next=%2Fstartup%2Fnew",
  signUp: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.search),
  useRouter: () => ({ push: mocks.push, replace: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/lib/auth-client", () => ({ authClient: { signUp: { email: mocks.signUp } } }));

import RegisterPage from "@/app/(auth)/register/page";

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.search = "next=%2Fstartup%2Fnew";
  mocks.signUp.mockReset().mockResolvedValue({});
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

async function fill(name: string, value: string) {
  const input = host.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("carries a safe listing destination through signup, verification links and the founder choice", async () => {
  await act(async () => root.render(<RegisterPage />));
  expect((host.querySelector('[name="founderMode"]') as HTMLInputElement).checked).toBe(true);
  expect(host.querySelector('[name="founderMode"]')?.parentElement?.textContent).toContain("Turn on founder mode to list your startup");
  expect([...host.querySelectorAll("a")].some(link => link.href.endsWith("/login?next=%2Fstartup%2Fnew"))).toBe(true);
  await fill("name", "A Founder");
  await fill("email", "founder@example.test");
  await fill("password", "Password1");
  await act(async () => {
    host.querySelector<HTMLInputElement>("#terms")!.checked = true;
    host.querySelector<HTMLInputElement>("#terms")!.dispatchEvent(new Event("change", { bubbles: true }));
    host.querySelector<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();
  });
  expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({
    founderMode: true,
    callbackURL: "/login?next=%2Fstartup%2Fnew",
  }));
  expect([...host.querySelectorAll("a")].some(link => link.href.endsWith("/resend-verification?next=%2Fstartup%2Fnew"))).toBe(true);
});
