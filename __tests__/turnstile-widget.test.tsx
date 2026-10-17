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
    vi.unstubAllEnvs();
    delete window.turnstile;
    document.head.innerHTML = "";
  });

  it("renders when Cloudflare loads during script insertion", async () => {
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
    expect(render).toHaveBeenCalledOnce();
    expect(render.mock.calls[0][1]).toMatchObject({
      sitekey: "test-site-key",
      "error-callback": expect.any(Function),
    });

    await act(async () => {
      const options = render.mock.calls[0][1] as Record<string, (code: string) => boolean>;
      options["error-callback"]("110200");
    });
    expect(container.textContent).toContain("not configured for this website domain");

    await act(async () => root.unmount());
    expect(remove).toHaveBeenCalledWith("widget-1");
    container.remove();
  });
});
