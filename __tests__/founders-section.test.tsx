import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import FoundersSection from "../components/startup/FoundersSection";

it("keeps the team visible as an empty state and offers owners a way to add it", () => {
  const visitor = renderToStaticMarkup(<FoundersSection founders={[]} />);
  expect(visitor).toContain("Team not yet added");
  expect(visitor).not.toContain("Add your team");

  const owner = renderToStaticMarkup(<FoundersSection founders={[]} editHref="/startup/fixture/edit" />);
  expect(owner).toContain('href="/startup/fixture/edit"');
  expect(owner).toContain("Add your team");
});
