import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { TOOL_DRAFT_KEYS, clearToolDrafts, temporaryToolDrafts, toolDraftErrors } from "../lib/browser-tool-drafts";
import { useBrowserDraft } from "../components/launch/useBrowserDraft";
import ToolWorkspace from "../components/launch/ToolWorkspace";
import LaunchKit from "../components/launch/LaunchKit";
import PitchBuilder from "../components/launch/PitchBuilder";
import ValidationPlanner from "../components/launch/ValidationPlanner";
import MvpScopeCutter from "../components/launch/MvpScopeCutter";
import LaunchChecklist from "../components/launch/LaunchChecklist";
import { buildPitch, EMPTY_FOUNDER, readFounder, interviewQuestions } from "../lib/founder-toolkit";
import { safeReturnPath, loginHref } from "../lib/login-return";
import { characterCount } from "../lib/characters";
import { replyToCommentSchema } from "../lib/validators/comment.schema";

const account = vi.hoisted(() => ({ id: "alice" as string | null, pending: false }));
vi.mock("@/lib/auth-client", () => ({ authClient: { useSession: () => ({ data: account.id ? { user: { id: account.id } } : null, isPending: account.pending }) } }));
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); localStorage.clear(); temporaryToolDrafts.clear(); toolDraftErrors.clear();
  account.id = "alice"; account.pending = false;
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const button = (name: string) => [...host.querySelectorAll("button")].find(item => item.textContent === name)!;
async function fill(element: HTMLTextAreaElement, text: string) {
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(element, text); element.dispatchEvent(new Event("input", { bubbles: true })); });
}

it("never reads another account's or legacy tool text, including the reported Wil case", async () => {
  function AllDrafts() { return <>{TOOL_DRAFT_KEYS.map(key => <Draft key={key} base={key} />)}</>; }
  function Draft({ base }: { base: string }) { const draft = useBrowserDraft(base, readFounder); return <p>{draft.data.name}</p>; }
  for (const base of TOOL_DRAFT_KEYS) {
    localStorage.setItem(base, '{"name":"Wil legacy"}');
    localStorage.setItem(`${base}:user:alice`, '{"name":"Wil Alice"}');
  }
  account.id = "bob";
  await act(async () => root.render(<AllDrafts />));
  expect(host.textContent).not.toContain("Wil");
  account.id = "alice";
  await act(async () => root.render(<AllDrafts />));
  expect([...host.querySelectorAll("p")].every(item => item.textContent === "Wil Alice")).toBe(true);
  await act(async () => { expect(clearToolDrafts()).toBe(true); });
  account.id = null;
  await act(async () => root.render(<AllDrafts />));
  expect(host.textContent).not.toContain("Wil");
  expect(Object.keys(localStorage)).toHaveLength(0);
});

it("preserves unrelated browser preferences when signing out and drops memory-only private drafts", () => {
  localStorage.setItem("anshkosh-cookie-consent", "dismissed");
  localStorage.setItem("anshkosh-mvp-v1:user:alice", "private");
  temporaryToolDrafts.set("anshkosh-founder-details-v1:user:alice", "private memory");
  clearToolDrafts();
  expect(localStorage.getItem("anshkosh-cookie-consent")).toBe("dismissed");
  expect(localStorage.getItem("anshkosh-mvp-v1:user:alice")).toBeNull();
  expect(temporaryToolDrafts.size).toBe(0);
});

it("disables typing until identity and drafts are ready, then shows the complete saved field", async () => {
  account.pending = true;
  localStorage.setItem("anshkosh-validation-v1:user:alice", '{"hypothesis":"Saved hypothesis"}');
  await act(async () => root.render(<ToolWorkspace><ValidationPlanner /></ToolWorkspace>));
  expect(host.querySelector("textarea")?.matches(":disabled")).toBe(true);
  account.pending = false;
  await act(async () => root.render(<ToolWorkspace><ValidationPlanner /></ToolWorkspace>));
  const hypothesis = host.querySelectorAll("textarea")[3];
  expect(hypothesis.value).toBe("Saved hypothesis");
  expect(hypothesis.matches(":disabled")).toBe(false);
  await fill(hypothesis, "New complete hypothesis");
  await act(async () => root.render(<ToolWorkspace><ValidationPlanner /></ToolWorkspace>));
  expect(hypothesis.value).toBe("New complete hypothesis");
});

it("clears an MVP result and ticks without resurrecting them on a fresh mount", async () => {
  localStorage.setItem("anshkosh-mvp-v1:user:alice", JSON.stringify({ success: "Private success", features: [{ id: "one", name: "Manual pilot", manual: true }] }));
  await act(async () => root.render(<MvpScopeCutter />));
  expect(host.textContent).toContain("Manual pilot");
  await act(async () => button("Clear this draft").click());
  await act(async () => button("Yes, clear draft").click());
  expect(localStorage.getItem("anshkosh-mvp-v1:user:alice")).toBeNull();
  await act(async () => root.render(<div />));
  await act(async () => root.render(<MvpScopeCutter />));
  expect(host.textContent).not.toContain("Manual pilot");
  expect([...host.querySelectorAll("textarea")].every(field => !field.value)).toBe(true);
});

it("keeps a cleared checklist tick cleared after remount", async () => {
  localStorage.setItem("anshkosh-launch-checklist-v1:user:alice", '["problem"]');
  await act(async () => root.render(<LaunchChecklist />));
  await act(async () => (host.querySelector('input[type="checkbox"]') as HTMLInputElement).click());
  await act(async () => root.render(<div />));
  await act(async () => root.render(<LaunchChecklist />));
  expect((host.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(false);
});

it("returns only to local application paths without auth loops or open redirects", () => {
  for (const value of ["https://evil.test", "//evil.test", "/\\evil.test", "/%2fevil.test", "/login", "/api/auth/sign-out", "/../logout", "/settings\r\nLocation:evil"]) expect(safeReturnPath(value)).toBe("/dashboard");
  expect(safeReturnPath("/settings?tab=security#password")).toBe("/settings?tab=security#password");
  expect(loginHref("/settings")).toBe("/login?next=%2Fsettings");
  expect(safeReturnPath(null)).toBe("/dashboard");
});

it("uses grammatical distinct pitch formats and cleans pasted punctuation", () => {
  const pitch = buildPitch({ ...EMPTY_FOUNDER, name: "TestCo", audience: "Small shops", outcome: "File GST on time..", approach: "calculates GST from photos..", problem: '"Slow records."' })!;
  expect(pitch.oneLine).toBe("TestCo helps small shops file GST on time.");
  expect(pitch.introduction).toContain("How it works: calculates GST from photos.");
  expect(pitch.announcement).not.toContain(pitch.introduction);
  expect(pitch.announcement).not.toContain("..");
  expect(interviewQuestions({ ...EMPTY_FOUNDER, problem: '“Slow records.”' })[0]).not.toContain('.”');
});

it("counts emoji and combining sequences consistently in both client and server", () => {
  expect(characterCount("qa-test 😀")).toBe(9);
  expect(characterCount("a\u0301👨‍👩‍👧‍👦")).toBe(2);
  const id = "cm123456789012345678901234";
  expect(replyToCommentSchema.safeParse({ commentId: id, reply: "😀".repeat(2000) }).success).toBe(true);
  expect(replyToCommentSchema.safeParse({ commentId: id, reply: "😀".repeat(2001) }).success).toBe(false);
});

it("does not resurrect cleared shared details from the launch kit", async () => {
  localStorage.setItem("anshkosh-founder-details-v1:user:alice", '{"name":"Old company"}');
  localStorage.setItem("anshkosh-founder-kit-v1:user:alice", '{"name":"Old company","description":"Keep private notes"}');
  await act(async () => root.render(<PitchBuilder />));
  await act(async () => button("Clear shared startup details").click());
  await act(async () => button("Yes, clear draft").click());
  await act(async () => root.render(<LaunchKit />));
  expect((host.querySelector("#kit-name") as HTMLTextAreaElement).value).toBe("");
  expect((host.querySelector("#kit-description") as HTMLTextAreaElement).value).toBe("Keep private notes");
});
