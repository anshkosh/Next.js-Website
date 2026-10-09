import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, expect, it, vi } from "vitest";
import { PreEntryCurtain } from "../components/site/PreEntryCurtain";
import { UnderConstructionBanner } from "../components/site/UnderConstructionBanner";
import { previewMotionRequested } from "../lib/preview-motion";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
beforeEach(() => { route.pathname = "/"; });

it("removes homepage preview on navigation and releases content and scrolling", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  const content = document.createElement("div");
  content.id = "site-content";
  document.body.append(container, content);
  const previousOverflow = document.body.style.overflow;
  const root = createRoot(container);
  try {
    await act(async () => root.render(<><PreEntryCurtain /><UnderConstructionBanner /></>));
    expect(content.inert).toBe(true);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.querySelector('aside[aria-label="Site status"]')).not.toBeNull();
    route.pathname = "/journal";
    await act(async () => root.render(<><PreEntryCurtain /><UnderConstructionBanner /></>));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('aside')).toBeNull();
    expect(content.inert).toBe(false);
    expect(document.body.style.overflow).toBe(previousOverflow);
  } finally {
    await act(async () => root.unmount());
    container.remove(); content.remove(); vi.unstubAllGlobals();
  }
});

it("enters immediately with reduced motion and restores access and focus", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  const container = document.createElement("div");
  const content = document.createElement("div");
  content.id = "site-content";
  const main = document.createElement("main");
  main.id = "main-content";
  content.append(main);
  document.body.append(container, content);
  const previousOverflow = document.body.style.overflow;
  const root = createRoot(container);
  try {
    await act(async () => root.render(<PreEntryCurtain />));
    expect(content.inert).toBe(true);
    await act(async () => container.querySelector("button")!.click());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(content.inert).toBe(false);
    expect(document.activeElement).toBe(main);
    expect(document.body.style.overflow).toBe(previousOverflow);
    expect(previewMotionRequested()).toBe(false);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    content.remove();
    vi.unstubAllGlobals();
  }
});

it("opens with Sneak peek, has no skip button, and unlocks only after the reveal", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  const content = document.createElement("div");
  content.id = "site-content";
  const main = document.createElement("main");
  main.id = "main-content";
  content.append(main);
  document.body.append(container, content);
  const previousOverflow = document.body.style.overflow;
  const root = createRoot(container);
  try {
    await act(async () => root.render(<PreEntryCurtain />));
    expect(content.inert).toBe(true);
    const enter = container.querySelector("button")!;
    expect(enter.textContent).toBe("Sneak peek");
    expect(previewMotionRequested()).toBe(false);
    await act(async () => enter.click());
    expect(previewMotionRequested()).toBe(true);
    expect(container.querySelector(".curtain-stage--opening")).not.toBeNull();
    expect(container.textContent).not.toContain("Skip animation");
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(content.inert).toBe(true);
    const end = new Event("transitionend", { bubbles: true });
    Object.defineProperty(end, "propertyName", { value: "transform" });
    await act(async () => container.querySelector(".curtain-panel--right")!.dispatchEvent(end));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(content.inert).toBe(false);
    expect(document.activeElement).toBe(main);
    expect(document.body.style.overflow).toBe(previousOverflow);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    content.remove();
    vi.unstubAllGlobals();
  }
});
