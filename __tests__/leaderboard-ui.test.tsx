import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import LeaderboardList from "../components/startup/LeaderboardList";
import UpvoteButton from "../components/upvote/UpvoteButton";

const action = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/upvote.actions", () => ({ toggleVote: action }));
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

it("keeps ranks, named vote controls and profile links accessible in populated rows", () => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(<LeaderboardList entries={[{
    id: "fixture", slug: "test-startup", name: "Test startup", tagline: "An explicitly synthetic test fixture", logoUrl: null,
    category: { name: "Technology" }, upvoteCount: 12, downvoteCount: 0, signalCount: 12, hasDownvoted: false, updateCount: 1, rank: 2, hasUpvoted: true,
    founderDays: 1, backers: 1, discussions: 1, activitySignals: 7, leaderboardScore: 19,
  }]} />);
  expect(host.querySelector('ol[aria-label="Startups ranked by all-time signals"]')).not.toBeNull();
  expect(host.querySelector('a[href="/startups/test-startup"]')?.textContent).toContain("Rank 2");
  expect(host.querySelector('button[aria-label="Remove upvote for Test startup, 12 upvotes"]')?.getAttribute("aria-pressed")).toBe("true");
  expect(host.textContent).toContain("1 founder update");
  expect(host.querySelector('[role="status"]')?.textContent).toContain("19 signals");
  expect(host.querySelector("details")?.textContent).toContain("Founder–community discussions: 1 · 3 points");
  expect(host.querySelector("details")?.textContent).toContain("Total signals: 19");
  expect(host.textContent).toContain("12 votes + 7 activity");
});

it.each(["rejected", "network"])("rolls back an optimistic vote and announces a %s failure", async kind => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  if (kind === "network") action.mockRejectedValueOnce(new Error("Disconnected"));
  else action.mockResolvedValueOnce({ error: "Rate limit exceeded. Please try again later." });
  const host = document.createElement("div");
  const root = createRoot(host);
  try {
    await act(async () => root.render(<UpvoteButton startupId="fixture" startupName="Test startup" initialCount={12} initialUpvoted={false} initialDownvotes={0} initialDownvoted={false} />));
    await act(async () => host.querySelector("button")!.click());
    expect(host.querySelector("button")?.getAttribute("aria-pressed")).toBe("false");
    expect(host.querySelector('[role="status"]')?.textContent).toContain("12 net votes");
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("try again");
  } finally { await act(async () => root.unmount()); }
});

it("switches from an upvote to a downvote, then removes it with authoritative totals", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div"); const root = createRoot(host);
  action.mockResolvedValueOnce({ success: true, vote: -1, upvoteCount: 11, downvoteCount: 4, signalCount: 7 });
  action.mockResolvedValueOnce({ success: true, vote: 0, upvoteCount: 11, downvoteCount: 3, signalCount: 8 });
  try {
    await act(async () => root.render(<UpvoteButton startupId="fixture" startupName="Test startup" initialCount={12} initialDownvotes={3} initialUpvoted={true} initialDownvoted={false} />));
    await act(async () => host.querySelectorAll("button")[1].click());
    expect(action).toHaveBeenLastCalledWith("fixture", -1);
    expect(host.querySelectorAll("button")[0].getAttribute("aria-pressed")).toBe("false");
    expect(host.querySelectorAll("button")[1].getAttribute("aria-pressed")).toBe("true");
    expect(host.querySelector('[role="status"]')?.textContent).toContain("7 net votes, 11 upvotes minus 4 downvotes");
    await act(async () => host.querySelectorAll("button")[1].click());
    expect(host.querySelectorAll("button")[1].getAttribute("aria-pressed")).toBe("false");
    expect(host.querySelector('[role="status"]')?.textContent).toContain("8 net votes");
  } finally { await act(async () => root.unmount()); }
});

it("preserves activity points when voting and accepts refreshed server totals", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = document.createElement("div"); const root = createRoot(host);
  action.mockResolvedValueOnce({ success: true, vote: 1, upvoteCount: 13, downvoteCount: 0, signalCount: 13 });
  const props = { startupId: "fixture", startupName: "Test", initialCount: 12, initialDownvotes: 0, initialUpvoted: false, initialDownvoted: false, activitySignals: 7 };
  try {
    await act(async () => root.render(<UpvoteButton {...props} />));
    expect(host.querySelector('[role="status"]')?.textContent).toContain("19 signals");
    await act(async () => host.querySelector("button")!.click());
    expect(host.querySelector('[role="status"]')?.textContent).toContain("20 signals");
    expect(host.textContent).toContain("13 votes + 7 activity");
    await act(async () => root.render(<UpvoteButton {...props} initialCount={16} initialUpvoted activitySignals={9} />));
    expect(host.querySelector('[role="status"]')?.textContent).toContain("25 signals");
  } finally { await act(async () => root.unmount()); }
});
