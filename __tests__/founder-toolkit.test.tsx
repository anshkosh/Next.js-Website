import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPitch, calculateRunway, DEFAULT_SUBMISSIONS, featureBucket, FOUNDER_KEY, FOUNDER_TOOLS, readFounder, readMvp, readSubmissions, readValidation, submissionsCsv } from "../lib/founder-toolkit";
import { canvasLines, readCardSettings } from "../lib/launch-card";
import { useBrowserDraft } from "../components/launch/useBrowserDraft";
import PitchBuilder from "../components/launch/PitchBuilder";
import LaunchKit from "../components/launch/LaunchKit";
import MvpScopeCutter from "../components/launch/MvpScopeCutter";
import ValidationPlanner from "../components/launch/ValidationPlanner";
import SubmissionTracker from "../components/launch/SubmissionTracker";
import ToolExport from "../components/launch/ToolExport";
import SupportPage from "../app/(public)/launch-support/page";
import PitchPage from "../app/(public)/launch-support/pitch/page";
import MvpPage from "../app/(public)/launch-support/mvp/page";
import ValidationPage from "../app/(public)/launch-support/validation/page";
import RunwayPage from "../app/(public)/launch-support/runway/page";
import TrackerPage from "../app/(public)/launch-support/tracker/page";
import CardPage from "../app/(public)/launch-support/launch-card/page";

const account = vi.hoisted(() => ({ id: null as string | null, pending: false }));
vi.mock("@/lib/auth-client", () => ({ authClient: { useSession: () => ({ data: account.id ? { user: { id: account.id } } : null, isPending: account.pending }) } }));

let root: Root | undefined; let container: HTMLDivElement;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); localStorage.clear(); account.id = null; account.pending = false; container = document.createElement("div"); document.body.append(container); });
afterEach(async () => { if (root) await act(async () => root?.unmount()); root = undefined; container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
async function mount(element: ReactNode) { root = createRoot(container); await act(async () => root?.render(element)); }
async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => { Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value); element.dispatchEvent(new Event("input", { bubbles: true })); });
}
function button(label: string) { return [...container.querySelectorAll("button")].find(item => item.textContent?.includes(label))!; }

describe("founder toolkit calculations and exports", () => {
  it("calculates burn and expense scenarios, including zero cash and cash-positive operations", () => {
    const base = { cash: "600000", expenses: "150000", revenue: "50000", adjustment: "0" };
    expect(calculateRunway(base)).toMatchObject({ burn: 100000, months: 6 });
    const reduced = calculateRunway({ ...base, adjustment: "-20" });
    expect(reduced).toMatchObject({ expenses: 120000, burn: 70000 });
    expect(calculateRunway({ ...base, cash: "0" })).toMatchObject({ months: 0 });
    expect(calculateRunway({ ...base, revenue: "150000" })).toMatchObject({ burn: 0, months: null });
    expect(calculateRunway({ ...base, revenue: "200000" })).toMatchObject({ burn: -50000, months: null });
    expect(calculateRunway({ cash: "1", expenses: "0.3", revenue: "0.1", adjustment: "0" })).toMatchObject({ burn: 0.2, months: 5 });
    expect(calculateRunway({ cash: "600000", expenses: "1e-323", revenue: "0", adjustment: "0" })).toMatchObject({ months: null });
    if (!("error" in reduced)) { expect(reduced.balances[11].balance).toBe(0); expect(reduced.balances[0].balance).toBe(530000); }
    for (const patch of [{ cash: "" }, { cash: "NaN" }, { cash: "-1" }, { cash: "Infinity" }, { revenue: "1000000000001" }, { adjustment: "51" }]) expect(calculateRunway({ ...base, ...patch })).toHaveProperty("error");
  });
  it("uses founder-provided facts, omits unsafe links, and requires the essential pitch inputs", () => {
    const details = readFounder(JSON.stringify({ name: "DabbaLoop", audience: "office teams", outcome: "organise lunch", approach: "sharing one order list", problem: "Orders take too long", websiteUrl: "javascript:alert(1)" }));
    expect(buildPitch(details)?.oneLine).toBe("DabbaLoop helps office teams organise lunch by sharing one order list.");
    expect(buildPitch(details)?.announcement).not.toContain("javascript:");
    expect(buildPitch({ ...details, audience: "" })).toBeNull();
    expect(buildPitch(details)?.announcement).not.toMatch(/validated|funded|users|revenue/);
  });
  it("keeps manual work out of the first-build list and ignores unrelated features", () => {
    const base = { id: "one", name: "Order list", promise: false, essential: false, manual: false };
    expect(featureBucket(base)).toBe("Save for later");
    expect(featureBucket({ ...base, promise: true })).toBe("Build first");
    expect(featureBucket({ ...base, essential: true, manual: true })).toBe("Handle manually");
    expect(featureBucket({ ...base, manual: true })).toBe("Handle manually");
  });
  it("recovers safely from malformed drafts and validates enums, lengths and duplicate rows", () => {
    for (const raw of ["broken", "null", "[]"]) {
      expect(readFounder(raw).name).toBe(""); expect(readMvp(raw).features).toEqual([]); expect(readValidation(raw).notes).toEqual([]);
      expect(readSubmissions(raw)).toEqual(DEFAULT_SUBMISSIONS);
    }
    expect(readFounder('{"name":42,"audience":"test"}')).toMatchObject({ name: "", audience: "test" });
    expect(readFounder(JSON.stringify({ name: "a".repeat(300) })).name).toHaveLength(120);
    expect(readMvp('{"features":[{"id":"a","name":"One","promise":"true"},{"id":"a","name":"Two"}]}').features).toHaveLength(1);
    expect(readMvp('{"features":[{"id":"a","name":"One","promise":"true"}]}').features[0].promise).toBe(false);
    expect(readValidation('{"notes":[{"id":"a","signal":"Automatically validated"}]}').notes[0].signal).toBe("No clear signal");
    expect(readCardSettings('{"theme":"__proto__","format":"bad","badge":"Unicorn"}')).toEqual({ theme: "charcoal", format: "landscape", badge: "Launching soon" });
  });
  it("exports quoted CSV with safe links and neutralises spreadsheet formulas", () => {
    const csv = submissionsCsv([{ ...DEFAULT_SUBMISSIONS[0], name: '=HYPERLINK("bad")', notes: '  +CMD(),"quote"\nnext line', listingUrl: "javascript:alert(1)" }]);
    expect(csv).toContain(`"'=HYPERLINK(""bad"")"`); expect(csv).toContain("'  +CMD()"); expect(csv).toContain('""quote""'); expect(csv).not.toContain("javascript:"); expect(csv).toContain("Follow-up date");
    expect(readSubmissions('{"rows":[]}')).toEqual([]);
  });
  it("wraps long unbroken names and truncates overflowing graphic copy", () => {
    const context = { measureText: (value: string) => ({ width: Array.from(value).length * 10 }) as TextMetrics };
    const lines = canvasLines(context, "abcdefghijklmno very long title here", 50, 2);
    expect(lines).toHaveLength(2); expect(lines[1]).toContain("…");
    expect(lines.every(line => context.measureText(line).width <= 50)).toBe(true);
  });
});

describe("founder toolkit workflows", () => {
  it("isolates signed-in tools from legacy, guest and other account data", async () => {
    localStorage.setItem(FOUNDER_KEY, JSON.stringify({ name: "Legacy private name" }));
    localStorage.setItem(`${FOUNDER_KEY}:guest`, JSON.stringify({ name: "Guest name" }));
    account.id = "alice";
    await mount(<PitchBuilder />);
    expect((container.querySelector("textarea") as HTMLTextAreaElement).value).toBe("");
    await fill(container.querySelector("textarea")!, "Alice draft");
    account.id = "bob";
    await act(async () => root?.render(<PitchBuilder />));
    expect((container.querySelector("textarea") as HTMLTextAreaElement).value).toBe("");
    await fill(container.querySelector("textarea")!, "Bob draft");
    account.id = "alice";
    await act(async () => root?.render(<PitchBuilder />));
    expect((container.querySelector("textarea") as HTMLTextAreaElement).value).toBe("Alice draft");
    account.id = null;
    await act(async () => root?.render(<PitchBuilder />));
    expect((container.querySelector("textarea") as HTMLTextAreaElement).value).toBe("Guest name");
    expect(localStorage.getItem(FOUNDER_KEY)).toContain("Legacy private name");
  });
  it("keeps sentence-style approaches out of the by-clause", () => {
    const pitch = buildPitch(readFounder(JSON.stringify({ name: "CreatorLedger", audience: "creators", outcome: "manage invoices", approach: "Each deal becomes a card. Track its progress." })));
    expect(pitch?.oneLine).toBe("CreatorLedger helps creators manage invoices.");
    expect(pitch?.introduction).toContain("How it works: Each deal becomes a card. Track its progress.");
  });

  it("shares startup details between the pitch builder and kit and restores them on a new visit", async () => {
    await mount(<PitchBuilder />);
    const fields = container.querySelectorAll("textarea");
    await fill(fields[0], "DabbaLoop"); await fill(fields[1], "office teams"); await fill(fields[3], "organise lunch"); await fill(fields[4], "sharing one order list");
    expect(container.textContent).toContain("DabbaLoop helps office teams organise lunch by sharing one order list.");
    await act(async () => button("Use pitch as card tagline").click());
    await act(async () => root?.unmount()); root = undefined;
    await mount(<LaunchKit />);
    expect((container.querySelector("#kit-name") as HTMLTextAreaElement).value).toBe("DabbaLoop");
    expect((container.querySelector("#kit-tagline") as HTMLTextAreaElement).value).toContain("organise lunch");
    await fill(container.querySelector("#kit-name")!, "New Name");
    expect(readFounder(localStorage.getItem(`${FOUNDER_KEY}:guest`)!).name).toBe("New Name");
    await act(async () => root?.unmount()); root = undefined;
    await mount(<PitchBuilder />); expect(container.textContent).toContain("New Name helps office teams");
  });
  it("keeps profile-derived details private until the founder explicitly reuses them", async () => {
    const profile = { name: "Owned startup", tagline: "Our pitch", description: "Description", audience: "Teams", websiteUrl: "https://example.com", stage: "Pilot", evidence: "Test notes", team: "Founder", assets: [] };
    await mount(<LaunchKit initialData={profile} fromProfile />);
    expect(localStorage.getItem(`${FOUNDER_KEY}:guest`)).toBeNull();
    await fill(container.querySelector("#kit-name")!, "Edited name");
    expect(localStorage.getItem(`${FOUNDER_KEY}:guest`)).toBeNull();
    await act(async () => button("Use these details in free tools").click());
    expect(readFounder(localStorage.getItem(`${FOUNDER_KEY}:guest`)!).name).toBe("Edited name");
  });
  it("keeps multiple views in sync when browser storage fails, and recovers on the next successful save", async () => {
    function View() { const draft = useBrowserDraft("toolkit-storage-test", readFounder); return <><input value={draft.data.name} onChange={event => draft.update({ name: event.target.value })} /><span>{draft.data.name}</span><p role="alert">{draft.storageError}</p></>; }
    const save = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    await mount(<><View /><View /></>);
    await fill(container.querySelector("input")!, "Working draft");
    expect([...container.querySelectorAll("input")].map(input => input.value)).toEqual(["Working draft", "Working draft"]);
    expect(container.textContent).toContain("could not save");
    save.mockRestore(); await fill(container.querySelector("input")!, "Recovered draft");
    expect(localStorage.getItem("toolkit-storage-test:guest")).toContain("Recovered draft");
    expect(container.textContent).not.toContain("could not save");
  });
  it("adds and prioritises an MVP feature, then removes it", async () => {
    await mount(<MvpScopeCutter />); await fill(container.querySelector("input:not([type])")!, "Order list");
    await act(async () => button("Add feature").click());
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    await act(async () => (checkboxes[0] as HTMLInputElement).click());
    expect(readMvp(localStorage.getItem("anshkosh-mvp-v1:guest")!).features[0].promise).toBe(true);
    await act(async () => (checkboxes[2] as HTMLInputElement).click());
    expect(container.textContent).toContain("Handle manually");
    await act(async () => (container.querySelector('button[aria-label="Remove Order list"]') as HTMLButtonElement).click());
    expect(readMvp(localStorage.getItem("anshkosh-mvp-v1:guest")!).features).toEqual([]);
  });
  it("records and removes actual interview evidence", async () => {
    await mount(<ValidationPlanner />);
    await fill(container.querySelector("input")!, "Manager 1");
    await fill(container.querySelectorAll("textarea")[7], "Spent an hour collecting orders yesterday.");
    await act(async () => button("Add evidence note").click());
    expect(readValidation(localStorage.getItem("anshkosh-validation-v1:guest")!).notes[0]).toMatchObject({ participant: "Manager 1", observation: "Spent an hour collecting orders yesterday.", signal: "No clear signal" });
    await act(async () => button("Remove note").click());
    expect(readValidation(localStorage.getItem("anshkosh-validation-v1:guest")!).notes).toHaveLength(0);
  });
  it("allows typing a complete listing URL, persists statuses and removes a directory", async () => {
    await mount(<SubmissionTracker />);
    const listing = container.querySelector('input[type="url"]') as HTMLInputElement;
    await fill(listing, "h"); expect(listing.value).toBe("h");
    await fill(listing, "https://example.com/listing");
    const select = container.querySelector("select")!;
    await act(async () => { select.value = "Accepted"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(readSubmissions(localStorage.getItem("anshkosh-submissions-v1:guest")!)[0]).toMatchObject({ status: "Accepted", listingUrl: "https://example.com/listing" });
    expect(container.querySelector('a[href="https://example.com/listing"]')).not.toBeNull();
    await act(async () => (container.querySelector('button[aria-label="Remove Product Hunt from tracker"]') as HTMLButtonElement).click());
    expect(readSubmissions(localStorage.getItem("anshkosh-submissions-v1:guest")!)).toHaveLength(4);
  });
  it("copies the actual export and provides selectable text if clipboard access is blocked", async () => {
    const copy = vi.fn().mockResolvedValue(undefined); vi.stubGlobal("navigator", { clipboard: { writeText: copy } });
    await mount(<ToolExport text="Real results" filename="results.txt" />);
    await act(async () => button("Copy results").click()); expect(copy).toHaveBeenCalledWith("Real results");
    copy.mockRejectedValue(new Error("denied")); await act(async () => button("Copy results").click());
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Select and copy");
    expect(container.querySelector("textarea")?.value).toBe("Real results");
  });
  it("downloads results with the correct content type and releases the temporary URL", async () => {
    vi.useFakeTimers(); const create = vi.fn((blob: Blob) => { void blob; return "blob:test"; }); const revoke = vi.fn();
    vi.stubGlobal("URL", class extends URL { static createObjectURL = create; static revokeObjectURL = revoke; });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await mount(<ToolExport text="a,b\r\n1,2" filename="tracker.csv" mime="text/csv;charset=utf-8" downloadLabel="Download CSV" />);
    await act(async () => button("Download CSV").click());
    expect(create.mock.calls[0][0].type).toBe("text/csv;charset=utf-8");
    await act(async () => vi.advanceTimersByTime(1000)); expect(revoke).toHaveBeenCalledWith("blob:test");
  });
  it("links every tool from the hub and gives each new page one heading and an active navigation link", () => {
    const hub = new DOMParser().parseFromString(renderToStaticMarkup(<SupportPage />), "text/html");
    for (const tool of FOUNDER_TOOLS) expect(hub.querySelector(`a[href="/launch-support/${tool.id}"]`)).not.toBeNull();
    for (const Page of [PitchPage, MvpPage, ValidationPage, RunwayPage, TrackerPage, CardPage]) {
      const doc = new DOMParser().parseFromString(renderToStaticMarkup(<Page />), "text/html");
      expect(doc.querySelectorAll("h1")).toHaveLength(1); expect(doc.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    }
  });
});
