import { expect, it } from "vitest";
import { GET } from "../app/signup/route";

it("keeps the signup redirect relative behind a reverse proxy", () => {
  const response = GET();
  expect(response.status).toBe(308);
  expect(response.headers.get("location")).toBe("/register");
});
