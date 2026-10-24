import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import NavigationLinks from "../components/layout/NavigationLinks";
import MobileNav from "../components/layout/MobileNav";

const route = vi.hoisted(() => ({ pathname: "/journal/example", push: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useRouter: () => ({ push: route.push }) }));

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  route.pathname = "/journal/example";
  route.push.mockClear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

it("marks the containing section on nested routes without matching a similar prefix", async () => {
  await act(async () => root.render(<NavigationLinks />));
  expect(host.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe("/journal");
  route.pathname = "/journalist";
  await act(async () => root.render(<NavigationLinks />));
  expect(host.querySelector('[aria-current="page"]')).toBeNull();
  route.pathname = "/category/saas";
  await act(async () => root.render(<NavigationLinks />));
  expect(host.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe("/discover");
  route.pathname = "/leaderboard";
  await act(async () => root.render(<NavigationLinks />));
  expect(host.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe("/leaderboard");
});

it("closes mobile navigation with Escape and returns focus to its toggle", async () => {
  await act(async () => root.render(<MobileNav authenticated={false} />));
  const toggle = host.querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')!;
  act(() => toggle.click());
  const current = host.querySelector<HTMLAnchorElement>('nav [aria-current="page"]')!;
  current.focus();
  act(() => current.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(host.querySelector("#mobile-navigation")).toBeNull();
  expect(document.activeElement).toBe(toggle);
});

it("dismisses mobile navigation when clicking outside it", async () => {
  await act(async () => root.render(<MobileNav authenticated={false} />));
  act(() => host.querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')!.click());
  act(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true })));
  expect(host.querySelector("#mobile-navigation")).toBeNull();
});

it("closes search with Escape without closing its mobile navigation parent", async () => {
  await act(async () => root.render(<MobileNav authenticated={false} />));
  act(() => host.querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')!.click());
  const search = host.querySelector<HTMLButtonElement>('[aria-label="Search the site"]')!;
  act(() => search.click());
  const input = host.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(host.querySelector('form[id$="-panel"]')).toBeNull();
  expect(host.querySelector("#mobile-navigation")).not.toBeNull();
  expect(document.activeElement).toBe(search);
});

it("closes mobile navigation when site search submits, including on the search route", async () => {
  route.pathname = "/search";
  await act(async () => root.render(<MobileNav authenticated={false} />));
  const toggle = host.querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')!;
  act(() => toggle.click());
  act(() => host.querySelector<HTMLButtonElement>('[aria-label="Search the site"]')!.click());
  const input = host.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, "founder tools");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const form = host.querySelector<HTMLFormElement>('form[id$="-panel"]')!;
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(route.push).toHaveBeenCalledWith("/search?q=founder%20tools");
  expect(host.querySelector("#mobile-navigation")).toBeNull();
  expect(document.activeElement).toBe(toggle);
});
