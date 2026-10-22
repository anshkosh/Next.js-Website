import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import NavigationLinks from "../components/layout/NavigationLinks";
import MobileNav from "../components/layout/MobileNav";

const route = vi.hoisted(() => ({ pathname: "/journal/example" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useRouter: () => ({ push: vi.fn() }) }));

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  route.pathname = "/journal/example";
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
