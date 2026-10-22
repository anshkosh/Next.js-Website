import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TurnstileWidget from "../components/startup/TurnstileWidget";

describe("TurnstileWidget", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key");
    document.head.innerHTML = "";
    delete window.turnstile;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete window.turnstile;
    document.head.innerHTML = "";
  });

  it("renders when Cloudflare loads during script insertion", async () => {
    const trustedScript = document.createElement("script");
    trustedScript.nonce = "test-page-nonce";
    document.head.appendChild(trustedScript);
    const render = vi.fn().mockReturnValue("widget-1");
    const remove = vi.fn();
    const appendChild = vi.spyOn(document.head, "appendChild").mockImplementation((node) => {
      window.turnstile = { render, reset: vi.fn(), remove };
      node.dispatchEvent(new Event("load"));
      return node;
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TurnstileWidget onToken={vi.fn()} />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(appendChild).toHaveBeenCalledOnce();
    expect((appendChild.mock.calls[0][0] as HTMLScriptElement).nonce).toBe("test-page-nonce");
    expect(render).toHaveBeenCalledOnce();
    expect(render.mock.calls[0][1]).toMatchObject({ sitekey: "test-site-key" });

    await act(async () => root.unmount());
    expect(remove).toHaveBeenCalledWith("widget-1");
    container.remove();
  });

  it("removes a failed script and retries with a fresh request", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const nativeAppend = document.head.appendChild.bind(document.head);
    const render = vi.fn().mockReturnValue("retried-widget");
    let attempts = 0;
    const append = vi.spyOn(document.head, "appendChild").mockImplementation(node => {
      nativeAppend(node);
      if (attempts++ === 0) node.dispatchEvent(new Event("error"));
      else {
        window.turnstile = { render, reset: vi.fn(), remove: vi.fn() };
        node.dispatchEvent(new Event("load"));
      }
      return node;
    });
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => { root.render(<TurnstileWidget onToken={vi.fn()} />); });
      expect(container.textContent).toContain("Retry CAPTCHA");
      expect(document.getElementById("cf-turnstile-script")).toBeNull();
      await act(async () => { container.querySelector("button")!.click(); });
      expect(append).toHaveBeenCalledTimes(2);
      expect(render).toHaveBeenCalledOnce();
      expect(container.textContent).not.toContain("Retry CAPTCHA");
    } finally { await act(async () => root.unmount()); container.remove(); append.mockRestore(); errors.mockRestore(); }
  });
});
