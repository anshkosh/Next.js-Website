import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import DiscussionSection from "../components/startup/DiscussionSection";
import { COMMENT_LANGUAGE_WARNING } from "../lib/comment-language";
const mocks = vi.hoisted(() => ({ submit: vi.fn(), availability: vi.fn() }));
vi.mock("@/app/actions/comment.actions", () => ({ submitComment: mocks.submit, fetchApprovedComments: vi.fn(), getCommentAvailability: mocks.availability }));
vi.mock("@/components/startup/TurnstileWidget", () => ({ default: ({ onToken }: { onToken: (token: string) => void }) => <button type="button" onClick={() => onToken("test-token")}>CAPTCHA fixture</button> }));
const available = { allowed: true, available: true, retryAfterSeconds: 1, message: "" };
const props = { startupId: "cmvddwy1h0000zgy2oi9d66n3", startupSlug: "fixture", initialComments: [], initialNextCursor: null, totalApprovedCount: 0, initialPendingComments: [], initialAvailability: available, viewer: { name: "Kosh", email: "kosh@example.test" } };
let host: HTMLDivElement, root: Root;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); host = document.createElement("div"); document.body.append(host); root = createRoot(host); mocks.availability.mockResolvedValue(available); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

it("prefills the signed-in author and makes the posting identity visible", () => {
  const html = renderToStaticMarkup(<DiscussionSection {...props} />);
  host.innerHTML = html;
  expect(host.querySelector<HTMLInputElement>("#comment-name")?.value).toBe("Kosh");
  expect(host.querySelector<HTMLInputElement>("#comment-email")?.value).toBe("kosh@example.test");
  expect(host.textContent).toContain("Signed in as Kosh");
});

it("shows an exhausted allowance without mounting a challenge", () => {
  host.innerHTML = renderToStaticMarkup(<DiscussionSection {...props} initialAvailability={{ allowed: false, available: true, retryAfterSeconds: 1200, message: "Network allowance exhausted" }} />);
  expect(host.textContent).toContain("Network allowance exhausted");
  expect(host.textContent).not.toContain("CAPTCHA fixture");
  expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
});

it.each([
  { body: "A new pilot question", warning: undefined },
  { body: "You are an idiot.", warning: COMMENT_LANGUAGE_WARNING },
  { body: "[MODTEST-R3 #3] You are a clueless fraud and a complete idiot, nobody with a working brain would trust an incompetent clown like you.", warning: COMMENT_LANGUAGE_WARNING },
  { body: "This product is useless right now; the team should rethink the problem instead of putting a volunteer with a paper register in a ward office.", warning: undefined },
  { body: "We will show up at the test booth and smash your register table.", warning: COMMENT_LANGUAGE_WARNING },
])("shows a private receipt and any language warning for $body", async ({ body, warning }) => {
  mocks.submit.mockResolvedValue({ success: true, warning, pendingComment: { id: "pending", authorName: "Kosh", body, createdAt: new Date().toISOString() } });
  await act(async () => root.render(<DiscussionSection {...props} />));
  const textarea = host.querySelector<HTMLTextAreaElement>("#comment-body")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, body);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    [...host.querySelectorAll("button")].find(button => button.textContent === "CAPTCHA fixture")!.click();
  });
  expect(host.textContent?.includes(COMMENT_LANGUAGE_WARNING)).toBe(Boolean(warning));
  await act(async () => { host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  const pending = host.querySelector('[aria-label="Your pending comments"]');
  expect(pending?.textContent).toContain(body);
  expect(pending?.textContent).toContain("Awaiting review");
  expect(pending?.textContent).not.toContain("kosh@example.test");
  if (warning) expect(host.querySelector('[role="alert"]')?.textContent).toContain("held for human review");
});
