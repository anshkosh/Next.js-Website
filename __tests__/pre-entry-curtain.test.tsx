import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { PreEntryCurtain } from "../components/site/PreEntryCurtain";

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
    await act(async () => enter.click());
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
