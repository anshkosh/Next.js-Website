import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FeaturedStartupsCarousel from "../components/landing/FeaturedStartupsCarousel";

vi.mock("framer-motion", () => ({ useReducedMotion: () => false }));
vi.mock("@/components/startup/StartupCard", () => ({
  default: ({ startup }: { startup: { name: string } }) => <div data-testid="startup-card">{startup.name}</div>,
}));

const startups = [
  { id: "one", slug: "one", name: "Startup One", tagline: "One", logoUrl: null, upvoteCount: 1, downvoteCount: 0, category: { name: "SaaS" }, hasUpvoted: false, hasDownvoted: false },
  { id: "two", slug: "two", name: "Startup Two", tagline: "Two", logoUrl: null, upvoteCount: 2, downvoteCount: 0, category: { name: "Food" }, hasUpvoted: false, hasDownvoted: false },
];

describe("featured startup carousel", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows one card at a time and advances every 30 seconds", async () => {
    await act(async () => root.render(<FeaturedStartupsCarousel startups={startups} />));
    expect(host.querySelectorAll('[data-testid="startup-card"]')).toHaveLength(1);
    expect(host.textContent).toContain("Startup One");

    await act(async () => { vi.advanceTimersByTime(29_999); });
    expect(host.textContent).toContain("Startup One");
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(host.querySelectorAll('[data-testid="startup-card"]')).toHaveLength(1);
    expect(host.textContent).toContain("Startup Two");
  });

  it("pauses automatic rotation while hovered and resumes after leaving", async () => {
    await act(async () => root.render(<FeaturedStartupsCarousel startups={startups} />));
    const carousel = host.querySelector('[aria-label="Featured startup carousel"]')!;
    await act(async () => carousel.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    await act(async () => { vi.advanceTimersByTime(30_000); });
    expect(host.textContent).toContain("Startup One");
    await act(async () => carousel.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })));
    await act(async () => { vi.advanceTimersByTime(30_000); });
    expect(host.textContent).toContain("Startup Two");
  });
});
