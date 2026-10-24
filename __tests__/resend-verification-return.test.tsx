import { act, Children, isValidElement, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/lib/auth-client", () => ({ authClient: { sendVerificationEmail: mocks.send } }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import ResendVerification from "@/components/auth/ResendVerification";
import ResendVerificationPage from "@/app/(auth)/resend-verification/page";

it("rejects repeated next values safely at the resend page boundary", async () => {
  const tree = await ResendVerificationPage({ searchParams: Promise.resolve({ next: ["/startup/new", "/dashboard"] }) });
  const widget = Children.toArray(tree.props.children).find(child => isValidElement(child) && child.type === ResendVerification) as ReactElement<{ next: string }>;
  expect(widget.props.next).toBe("/dashboard");
});

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.send.mockReset().mockResolvedValue({});
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

it("uses the safe preserved destination as the Better Auth verification callback", async () => {
  await act(async () => root.render(<ResendVerification next="/startup/new" />));
  const input = host.querySelector<HTMLInputElement>("input[name=email]")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "founder@example.test");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    host.querySelector<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();
  });
  expect(mocks.send).toHaveBeenCalledWith({ email: "founder@example.test", callbackURL: "/login?next=%2Fstartup%2Fnew" });
});
