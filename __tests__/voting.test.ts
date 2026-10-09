import { expect, it } from "vitest";
import { signalCount, voteTransition } from "../lib/voting";

it.each([
  [0, 1, 1, 1, 0], [0, -1, -1, 0, 1],
  [1, 1, 0, -1, 0], [-1, -1, 0, 0, -1],
  [1, -1, -1, -1, 1], [-1, 1, 1, 1, -1],
] as const)("transitions %i to requested %i without counting both directions", (current, requested, next, upvoteDelta, downvoteDelta) => {
  expect(voteTransition(current, requested)).toEqual({ next, upvoteDelta, downvoteDelta });
});
it("allows negative signals without confusing them with total votes", () => {
  expect(signalCount({ upvoteCount: 3, downvoteCount: 7 })).toBe(-4);
});
