import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ submit: vi.fn(), challenge: 0 }));
vi.mock("@/app/actions/beta-tester.actions", () => ({ submitBetaTesterRequest: mocks.submit }));
vi.mock("@/components/startup/TurnstileWidget", async () => {
  const React = await import("react");
  return { default: function FakeTurnstile({ onToken }: { onToken: (token: string) => void }) {
    const id = React.useRef<number | null>(null);
    if (id.current === null) id.current = ++mocks.challenge;
    return <button type="button" data-challenge={id.current} onClick={() => onToken(`token-${id.current}`)}>Complete CAPTCHA {id.current}</button>;
  } };
});
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import BetaTesterSignup from "@/components/startup/BetaTesterSignup";

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.challenge = 0;
  mocks.submit.mockReset().mockResolvedValueOnce({ error: "CAPTCHA verification failed. Please try again." }).mockResolvedValueOnce({ success: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

async function fill(name: string, value: string) {
  const control = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!;
  await act(async () => {
    const prototype = control instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(control, value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("refreshes consumed CAPTCHA tokens after every attempt and keeps entries on errors", async () => {
  await act(async () => root.render(<BetaTesterSignup startupId="startup" startupName="A Startup" description="Try it" reward={null} />));
  await fill("name", "Riya");
  await fill("email", "riya@example.test");
  await fill("message", "I would like to test this.");
  await act(async () => {
    host.querySelector<HTMLInputElement>("input[required]")!.click();
    const checks = host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    checks[0]!.click();
    checks[1]!.click();
  });
  await act(async () => host.querySelector<HTMLButtonElement>("[data-challenge]")!.click());

  const form = host.querySelector<HTMLFormElement>("form")!;
  await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); await Promise.resolve(); });
  expect(mocks.submit).toHaveBeenNthCalledWith(1, expect.objectContaining({ turnstileToken: "token-1", name: "Riya" }));
  expect(host.querySelector<HTMLInputElement>('[name="name"]')!.value).toBe("Riya");
  expect(host.querySelector<HTMLButtonElement>("[data-challenge]")?.dataset.challenge).toBe("2");

  await act(async () => host.querySelector<HTMLButtonElement>("[data-challenge]")!.click());
  await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); await Promise.resolve(); });
  expect(mocks.submit).toHaveBeenNthCalledWith(2, expect.objectContaining({ turnstileToken: "token-2", name: "Riya" }));
  expect(host.querySelector('[role="status"]')?.textContent).toContain("Your interest has been sent");
});

it("shows a recovery message when the server action rejects unexpectedly", async () => {
  mocks.submit.mockReset().mockRejectedValue(new Error("connection lost"));
  await act(async () => root.render(<BetaTesterSignup startupId="startup" startupName="A Startup" description="Try it" reward={null} />));
  await fill("name", "Riya");
  await fill("email", "riya@example.test");
  await act(async () => {
    const checks = host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    checks[0]!.click(); checks[1]!.click();
    host.querySelector<HTMLButtonElement>("[data-challenge]")!.click();
  });
  await act(async () => { host.querySelector<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); await Promise.resolve(); });
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("Your entries are still here");
  expect(host.querySelector<HTMLInputElement>('[name="name"]')!.value).toBe("Riya");
});
