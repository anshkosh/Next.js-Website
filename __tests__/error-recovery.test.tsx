import { afterEach, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import PageError from "../app/error";
import GlobalError from "../app/global-error";

vi.mock("@/components/site/ErrorMascot", () => ({ default: () => null }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each(["page", "global"])("lets a visitor retry a %s failure and return home", async (kind) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});
  const retry = vi.fn();
  const error = new Error("Temporary failure");
  const target = kind === "global" ? document.implementation.createHTMLDocument() : document.createElement("div");
  const root = createRoot(target);

  try {
    await act(async () => {
      root.render(kind === "global" ? <GlobalError error={error} retry={retry} /> : <PageError error={error} retry={retry} />);
    });
    const button = target.querySelector("button");
    expect(button?.textContent).toBe("Try again");
    expect(retry).not.toHaveBeenCalled();
    await act(async () => { button?.click(); });
    expect(retry).toHaveBeenCalledOnce();
    expect(target.querySelector('a[href="/"]')?.textContent).toBe("Back to homepage");
  } finally {
    await act(async () => { root.unmount(); });
  }
});
