import { expect, it } from "vitest";
import { calculateReadingTime } from "../lib/journal-reading-time.mjs";

it("rounds up article reading time using the same policy for short and long articles", () => {
  expect(calculateReadingTime(null)).toBe(1);
  expect(calculateReadingTime("<p></p>")).toBe(1);
  expect(calculateReadingTime(`<p>${"word ".repeat(200)}</p>`)).toBe(1);
  expect(calculateReadingTime(`<p>${"word ".repeat(201)}</p>`)).toBe(2);
  expect(calculateReadingTime(`<p>${"word ".repeat(601)}</p>`)).toBe(4);
});

it("counts visible text across block boundaries and entities while ignoring hidden markup", () => {
  const body = `${"<p>one&nbsp;two&#32;three</p>".repeat(67)}<!-- ${"hidden ".repeat(900)} --><script>${"hidden ".repeat(900)}</script><style>${"hidden ".repeat(900)}</style>`;
  expect(calculateReadingTime(body)).toBe(2);
  expect(calculateReadingTime(`<p>${"pro<em>to</em>type ".repeat(200)}</p>`)).toBe(1);
  expect(calculateReadingTime(`<p>${"भारत ".repeat(201)}</p>`)).toBe(2);
});
