import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SiteEnhancements } from "../components/site/SiteEnhancements";
import MobileNav from "../components/layout/MobileNav";
import RootLayout from "../app/layout";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/faq" }));
vi.mock("next/font/google", () => ({ Inter: () => ({ variable: "inter" }), Oswald: () => ({ variable: "oswald" }) }));

let root: Root, host: HTMLDivElement;
beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear(); window.sessionStorage.clear();
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount()); host.remove(); document.documentElement.classList.remove("dark");
});

it("clears legacy dark mode while preserving unrelated saved preferences", async () => {
  document.documentElement.classList.add("dark");
  window.localStorage.setItem("anshkosh-theme", "dark");
  window.localStorage.setItem("anshkosh-cookie-consent", "accepted");
  window.localStorage.setItem("draft:startup", "keep this draft");
  await act(async () => root.render(<SiteEnhancements />));
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  expect(window.localStorage.getItem("anshkosh-theme")).toBeNull();
  expect(window.localStorage.getItem("anshkosh-cookie-consent")).toBe("accepted");
  expect(window.localStorage.getItem("draft:startup")).toBe("keep this draft");
  expect(host.querySelector('[aria-label*="mode"]')).toBeNull();
});

it("keeps mobile navigation and search working without a theme switch", async () => {
  await act(async () => root.render(<MobileNav authenticated={false} />));
  act(() => host.querySelector<HTMLButtonElement>('[aria-label="Open navigation menu"]')!.click());
  const nav = host.querySelector('nav[aria-label="Mobile navigation"]');
  expect(nav).not.toBeNull();
  expect(nav?.querySelector('[aria-label="Search the site"]')).not.toBeNull();
  expect(nav?.querySelector('a[href="/login"]')).not.toBeNull();
  expect(nav?.querySelector('[aria-label*="mode"]')).toBeNull();
  act(() => host.querySelector<HTMLButtonElement>('[aria-label="Close navigation menu"]')!.click());
  expect(host.querySelector('nav[aria-label="Mobile navigation"]')).toBeNull();
});

it("renders a light-only root without a script restoring dark preferences", async () => {
  window.localStorage.setItem("anshkosh-theme", "dark");
  const html = renderToStaticMarkup(await RootLayout({ children: <main>Page content</main> }));
  expect(html).toContain('color-scheme:light');
  expect(html).not.toContain('classList.add("dark")');
  expect(html).not.toContain("anshkosh-theme");
  expect(html).toContain("Page content");
  expect(html).not.toContain("curtain-stage");
  expect(html).not.toContain('aria-label="Site status"');
});
