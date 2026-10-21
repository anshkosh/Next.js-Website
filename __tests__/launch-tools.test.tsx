import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportLaunchKit, launchKitFromProfile, LAUNCH_CHECKLIST, LAUNCH_DIRECTORIES, readChecklist, safeLaunchUrl } from "../lib/launch-resources";
import LaunchChecklist from "../components/launch/LaunchChecklist";
import LaunchKit from "../components/launch/LaunchKit";
import DirectoryCatalogue from "../components/launch/DirectoryCatalogue";
import DirectoryPage, { metadata as directoryMetadata } from "../app/(public)/launch-support/directories/page";
import ChecklistPage from "../app/(public)/launch-support/checklist/page";
import KitPage from "../app/(public)/launch-support/kit/page";
import { FOUNDER_TOOLS } from "../lib/founder-toolkit";

vi.mock("@/lib/auth-client", () => ({ authClient: { useSession: () => ({ data: null, isPending: false }) } }));

let root: Root | undefined;
let container: HTMLDivElement;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); localStorage.clear(); container = document.createElement("div"); document.body.append(container); });
afterEach(async () => { if (root) await act(async () => root?.unmount()); root = undefined; container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function mount(element: React.ReactNode) { root = createRoot(container); await act(async () => root?.render(element)); }

const profile = { name: "Cane Theory", tagline: "Pressed to Perfection", description: "A sugarcane pilot.", websiteUrl: "https://example.com", targetAudience: "Hyderabad", prototypeStatus: "Preparing a pilot", tractionEvidence: "No sales claimed.", logoUrl: "/images/logo.png", galleryImages: ["https://example.com/image.png", "javascript:alert(1)"], founders: [{ name: "Jai", role: "CEO" }], metadata: { privateDeck: "secret" }, startupPhone: "private-number", adminNotes: "private-notes" };

describe("free launch tools", () => {
  it("provides source-backed directory eligibility without pretending paid listings are free", () => {
    expect(LAUNCH_DIRECTORIES).toHaveLength(5);
    expect(new Set(LAUNCH_DIRECTORIES.map(item => item.name)).size).toBe(5);
    for (const item of LAUNCH_DIRECTORIES) { expect(new URL(item.source).protocol).toBe("https:"); expect(item.requirements).toBeTruthy(); }
    expect(LAUNCH_DIRECTORIES.find(item => item.name === "BetaList")?.cost).toBe("Paid");
    expect(LAUNCH_DIRECTORIES.find(item => item.name === "TechBaseDirectory")?.cost).toBe("Paid");
    expect(renderToStaticMarkup(<DirectoryCatalogue />)).toContain("No acceptance, backlink or search-ranking guarantee");
  });
  it("filters audiences and shows an actionable empty state", async () => {
    await mount(<DirectoryCatalogue />);
    const audience = container.querySelectorAll("select")[0];
    await act(async () => { audience.value = "Software & SaaS"; audience.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(container.querySelectorAll("article")).toHaveLength(2);
    const cost = container.querySelectorAll("select")[1];
    await act(async () => { cost.value = "Paid"; cost.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(container.textContent).toContain("No matching directories yet");
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    expect(container.querySelectorAll("article")).toHaveLength(5);
  });
  it("validates checklist storage rather than trusting malformed or unknown IDs", () => {
    expect(new Set(LAUNCH_CHECKLIST.map(item => item.id)).size).toBe(LAUNCH_CHECKLIST.length);
    expect(readChecklist('["problem","problem","unknown",42]')).toEqual(["problem"]);
    for (const raw of ["broken", "{}", "null"]) expect(readChecklist(raw)).toEqual([]);
  });
  it("saves checklist ticks and restores progress on a new visit", async () => {
    await mount(<LaunchChecklist />);
    await act(async () => (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click());
    expect(container.textContent).toContain("1 of 11 tasks complete");
    expect(readChecklist(localStorage.getItem("anshkosh-launch-checklist-v1:guest") ?? "")).toEqual(["problem"]);
    await act(async () => root?.unmount()); root = undefined;
    await mount(<LaunchChecklist />);
    expect((container.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(true);
  });
  it("keeps checklist interactive and gives an honest warning when browser storage fails", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    await mount(<LaunchChecklist />);
    await act(async () => (container.querySelector('input[type="checkbox"]') as HTMLInputElement).click());
    expect(container.textContent).toContain("1 of 11 tasks complete");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("lost on reload");
  });
  it("prefills only the intended profile fields, not contacts, decks or moderation notes", () => {
    const kit = launchKitFromProfile(profile);
    expect(kit.team).toBe("Jai — CEO"); expect(kit.assets).toHaveLength(2);
    expect(kit.assets[0].url).toMatch(/^https:\/\/www\.anshkosh\.com\//);
    expect(JSON.stringify(kit)).not.toMatch(/secret|private-number|private-notes|javascript:/);
    expect(exportLaunchKit(kit)).toContain("No submission or publication is performed.");
    expect(exportLaunchKit(kit)).toContain("Asset links (not bundled files)");
  });
  it("rejects unsafe, credential-bearing and protocol-relative asset URLs", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,x", "//evil.example", "/\\evil.example", "https://user:pass@example.com", "not a URL"]) expect(safeLaunchUrl(url)).toBe("");
    expect(safeLaunchUrl("/api/uploads/serve/gallery/image.webp")).toBeTruthy();
  });
  it("copies actual kit content and reports clipboard failure without claiming success", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText: write } });
    await mount(<LaunchKit initialData={launchKitFromProfile(profile)} fromProfile />);
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Cane Theory"));
    expect(container.querySelector('[role="status"]')?.textContent).toContain("copied");
    write.mockRejectedValue(new Error("denied"));
    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());
    expect(container.querySelector('[role="status"]')?.textContent).toContain("copy it manually");
  });
  it("exports a text kit and cleans up its download URL", async () => {
    vi.useFakeTimers();
    const create = vi.fn(() => "blob:test");
    const revoke = vi.fn();
    vi.stubGlobal("URL", class extends URL { static createObjectURL = create; static revokeObjectURL = revoke; });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await mount(<LaunchKit initialData={launchKitFromProfile(profile)} />);
    await act(async () => (container.querySelectorAll("button")[1] as HTMLButtonElement).click());
    expect(click).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(expect.any(Blob));
    expect(container.textContent).toContain("downloaded as text");
    await act(async () => vi.advanceTimersByTime(1000));
    expect(revoke).toHaveBeenCalledWith("blob:test");
  });
  it("renders one H1 and links to the complete toolkit on each public tool page", () => {
    for (const Page of [DirectoryPage, ChecklistPage, KitPage]) {
      const doc = new DOMParser().parseFromString(renderToStaticMarkup(<Page />), "text/html");
      expect(doc.querySelectorAll("h1")).toHaveLength(1);
      expect(doc.querySelectorAll('nav[aria-label="Launch tools"] a')).toHaveLength(FOUNDER_TOOLS.length);
      expect(doc.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    }
    expect(directoryMetadata.alternates?.canonical).toContain("/launch-support/directories");
  });
});
