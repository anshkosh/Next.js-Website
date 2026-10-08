import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import LeaderboardList from "../components/startup/LeaderboardList";
import UpvoteButton from "../components/upvote/UpvoteButton";

const action = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/upvote.actions", () => ({ toggleUpvote: action }));
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

it("keeps ranks, named vote controls and profile links accessible in populated rows", () => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(<LeaderboardList entries={[{
    id: "fixture", slug: "test-startup", name: "Test startup", tagline: "An explicitly synthetic test fixture", logoUrl: null,
    category: { name: "Technology" }, upvoteCount: 12, updateCount: 1, rank: 2, hasUpvoted: true,
  }]} />);
  expect(host.querySelector('ol[aria-label="Startups ranked by all-time votes"]')).not.toBeNull();
  expect(host.querySelector('a[href="/startups/test-startup"]')?.textContent).toContain("Rank 2");
  expect(host.querySelector('button[aria-label="Remove upvote for Test startup, 12 upvotes"]')?.getAttribute("aria-pressed")).toBe("true");
  expect(host.textContent).toContain("1 founder update");
});

it.each(["rejected", "network"])("rolls back an optimistic vote and announces a %s failure", async kind => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  if (kind === "network") action.mockRejectedValueOnce(new Error("Disconnected"));
  else action.mockResolvedValueOnce({ error: "Rate limit exceeded. Please try again later." });
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(async () => root.render(<UpvoteButton startupId="fixture" startupName="Test startup" initialCount={12} initialUpvoted={false} />));
    await act(async () => host.querySelector("button")!.click());
    expect(host.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
    expect(host.querySelector("button")?.textContent).toBe("12");
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("try again");
  } finally { await act(async () => root.unmount()); }
});
