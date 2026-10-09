import { expect, it } from "vitest";
import { publicStartupCard, publicStartupCardSelect } from "../lib/public-startup-card";

it("keeps private contacts, moderation fields, vote identifiers and private metadata out of browser props", () => {
  const fixture = {
    id: "fixture", slug: "fixture", name: "Test startup", tagline: "Synthetic fixture", logoUrl: null,
    category: { name: "Test", iconName: null }, upvoteCount: 3, downvoteCount: 2, updateCount: 0,
    metadata: { city: "Hyderabad", foundedYear: "2026", pitchDeckUrl: "/private/deck", privateNote: "private" },
    upvotes: [{ id: "private-upvote", cookieId: "private-cookie" }], downvotes: [],
    startupPhone: "private-number", adminNotes: "private-review", founderId: "private-owner",
  };
  const card = publicStartupCard(fixture);
  expect(card).toMatchObject({ hasUpvoted: true, hasDownvoted: false, metadata: { city: "Hyderabad", foundedYear: "2026" } });
  for (const key of ["upvotes", "downvotes", "startupPhone", "adminNotes", "founderId"]) expect(card).not.toHaveProperty(key);
  expect(JSON.stringify(card)).not.toContain("private");
  const select = publicStartupCardSelect("visitor");
  expect(select).not.toHaveProperty("startupPhone");
  expect(select.upvotes).toEqual({ where: { cookieId: "visitor" }, select: { id: true } });
});
