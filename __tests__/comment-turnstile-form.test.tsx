// @vitest-environment node
import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@/app/actions/comment.actions", () => ({ submitComment: vi.fn(), fetchApprovedComments: vi.fn() }));
vi.mock("@/components/startup/TurnstileWidget", () => ({ default: () => <div data-testid="captcha-widget" /> }));
import DiscussionSection from "../components/startup/DiscussionSection";

const props = { startupId: "cmvajoncw0001zgxyg2kloy8o", startupSlug: "example", initialComments: [], initialNextCursor: null, totalApprovedCount: 0 };
it("renders CAPTCHA and blocks posting until verified by default", () => {
  const html = renderToStaticMarkup(<DiscussionSection {...props} />);
  expect(html).toContain("captcha-widget");
  expect(html.match(/<button[^>]*type="submit"[^>]*>/)?.[0]).toContain('disabled=""');
});
it("hides CAPTCHA and enables the comment form when the server passes the temporary pause", () => {
  const html = renderToStaticMarkup(<DiscussionSection {...props} turnstileEnabled={false} />);
  expect(html).not.toContain("captcha-widget");
  expect(html.match(/<button[^>]*type="submit"[^>]*>/)?.[0]).not.toContain('disabled=""');
  expect(html).toContain("Comments are reviewed before appearing publicly");
});
