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
    vi.useRealTimers();
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

  it("recovers when a script request never finishes", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const nativeAppend = document.head.appendChild.bind(document.head);
    const render = vi.fn().mockReturnValue("recovered-widget");
    let requests = 0;
    vi.spyOn(document.head, "appendChild").mockImplementation(node => {
      nativeAppend(node);
      if (++requests === 2) {
        window.turnstile = { render, reset: vi.fn(), remove: vi.fn() };
        node.dispatchEvent(new Event("load"));
      }
      return node;
    });
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    const onToken = vi.fn();
    try {
      await act(async () => { root.render(<TurnstileWidget onToken={onToken} />); });
      expect(container.textContent).toContain("Loading security check");
      await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
      expect(container.textContent).toContain("Retry CAPTCHA");
      expect(document.getElementById("cf-turnstile-script")).toBeNull();
      expect(onToken).not.toHaveBeenCalled();
      await act(async () => { container.querySelector("button")!.click(); });
      expect(requests).toBe(2);
      expect(render).toHaveBeenCalledOnce();
      expect(onToken).not.toHaveBeenCalled();
      await act(async () => { render.mock.calls[0][1].callback("verified-token"); });
      expect(onToken).toHaveBeenCalledExactlyOnceWith("verified-token");
      expect(container.textContent).toContain("Security check complete");
    } finally { await act(async () => root.unmount()); container.remove(); }
  });

  it("keeps the widget host mounted after a challenge error and accepts a later success", async () => {
    const render = vi.fn().mockReturnValue("widget-1");
    window.turnstile = { render, reset: vi.fn(), remove: vi.fn() };
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    const onToken = vi.fn(), onExpire = vi.fn();
    try {
      await act(async () => { root.render(<TurnstileWidget onToken={onToken} onExpire={onExpire} />); });
      const host = render.mock.calls[0][0] as HTMLElement;
      const options = render.mock.calls[0][1];
      await act(async () => { options["error-callback"]("300030"); });
      expect(host.isConnected).toBe(true);
      expect(container.textContent).toContain("CAPTCHA could not complete");
      expect(onToken).not.toHaveBeenCalled();
      expect(onExpire).toHaveBeenCalled();
      await act(async () => { options.callback("retry-succeeded"); });
      expect(host.isConnected).toBe(true);
      expect(container.textContent).not.toContain("Retry CAPTCHA");
      expect(container.textContent).toContain("Security check complete");
      expect(onToken).toHaveBeenCalledExactlyOnceWith("retry-succeeded");
    } finally { await act(async () => root.unmount()); container.remove(); }
  });

  it("offers recovery for a silent widget and ignores callbacks from a replaced widget", async () => {
    vi.useFakeTimers();
    const render = vi.fn().mockReturnValueOnce("old-widget").mockReturnValue("new-widget");
    const remove = vi.fn(), reset = vi.fn();
    window.turnstile = { render, reset, remove };
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    const onToken = vi.fn(), onExpire = vi.fn();
    try {
      await act(async () => { root.render(<TurnstileWidget onToken={onToken} onExpire={onExpire} />); });
      const oldOptions = render.mock.calls[0][1];
      await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
      expect(container.textContent).toContain("taking longer than expected");
      expect(onToken).not.toHaveBeenCalled();
      await act(async () => { container.querySelector("button")!.click(); });
      expect(remove).toHaveBeenCalledWith("old-widget");
      expect(render).toHaveBeenCalledTimes(2);
      await act(async () => { oldOptions.callback("stale-token"); });
      expect(onToken).not.toHaveBeenCalled();
      const options = render.mock.calls[1][1];
      await act(async () => { options.callback("current-token"); });
      expect(onToken).toHaveBeenCalledExactlyOnceWith("current-token");
      await act(async () => { oldOptions["error-callback"](); });
      expect(container.textContent).toContain("Security check complete");
      const expiresBefore = onExpire.mock.calls.length;
      await act(async () => { options["expired-callback"](); });
      expect(onExpire).toHaveBeenCalledTimes(expiresBefore + 1);
      expect(reset).toHaveBeenCalledWith("new-widget");
      expect(container.textContent).not.toContain("Security check complete");
    } finally { await act(async () => root.unmount()); container.remove(); }
  });

  it("leaves time for a person to complete an interactive challenge", async () => {
    vi.useFakeTimers();
    const render = vi.fn().mockReturnValue("interactive-widget");
    window.turnstile = { render, reset: vi.fn(), remove: vi.fn() };
    const container = document.createElement("div"); document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => { root.render(<TurnstileWidget onToken={vi.fn()} />); });
      const options = render.mock.calls[0][1];
      await act(async () => { options["before-interactive-callback"](); await vi.advanceTimersByTimeAsync(60_000); });
      expect(container.textContent).not.toContain("Retry CAPTCHA");
      await act(async () => { options["after-interactive-callback"](); await vi.advanceTimersByTimeAsync(15_000); });
      expect(container.textContent).toContain("Retry CAPTCHA");
      await act(async () => {
        options.callback("completed-interactive-check");
        options["after-interactive-callback"]();
        await vi.advanceTimersByTimeAsync(15_000);
      });
      expect(container.textContent).toContain("Security check complete");
      expect(container.textContent).not.toContain("Retry CAPTCHA");
    } finally { await act(async () => root.unmount()); container.remove(); }
  });
});
