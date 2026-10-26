import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import UpdatesSection from "../components/startup/UpdatesSection";
import { updatesPageHref } from "../lib/public-updates";

vi.mock("next/image", () => ({ default: () => null }));

it("pages the update timeline with stable numbering and preserves the journal page", () => {
  const updates = Array.from({ length: 3 }, (_, index) => ({ id: `update-${index}`, title: `Progress ${index}`, body: "A public update", imageUrl: null, createdAt: "2026-10-01T12:00:00Z" }));
  const html = renderToStaticMarkup(<UpdatesSection updates={updates} totalCount={8} page={2} slug="fixture" journalPage={3} />);
  expect(html).toContain("Update #5"); expect(html).toContain("Update #3");
  expect(html).toContain("Page 2 of 3");
  expect(html).toContain('href="/startups/fixture?journalPage=3#section-updates"');
  expect(html).toContain('href="/startups/fixture?updatesPage=3&amp;journalPage=3#section-updates"');
  expect(html).not.toContain("Show 5 More");
});
it("renders an honest empty state without pagination", () => {
  const html = renderToStaticMarkup(<UpdatesSection updates={[]} totalCount={0} page={1} slug="fixture" journalPage={1} />);
  expect(html).toContain("No updates yet.");
  expect(html).not.toContain('aria-label="Founder update pages"');
});
it("omits default paging parameters", () => expect(updatesPageHref("fixture", 1)).toBe("/startups/fixture#section-updates"));
