import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import DiscussionSection from "../components/startup/DiscussionSection";
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

it("shows a private pending receipt after a successful submission", async () => {
  mocks.submit.mockResolvedValue({ success: true, pendingComment: { id: "pending", authorName: "Kosh", body: "A new pilot question", createdAt: new Date().toISOString() } });
  await act(async () => root.render(<DiscussionSection {...props} />));
  const textarea = host.querySelector<HTMLTextAreaElement>("#comment-body")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(textarea, "A new pilot question");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    [...host.querySelectorAll("button")].find(button => button.textContent === "CAPTCHA fixture")!.click();
  });
  await act(async () => { host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  const pending = host.querySelector('[aria-label="Your pending comments"]');
  expect(pending?.textContent).toContain("A new pilot question");
  expect(pending?.textContent).toContain("Awaiting review");
  expect(pending?.textContent).not.toContain("kosh@example.test");
});
