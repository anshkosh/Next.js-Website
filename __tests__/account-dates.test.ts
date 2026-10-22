import { afterEach, expect, it, vi } from "vitest";
import { accountToday, accountSavedTime } from "@/lib/account-dates";
import { dateOfBirthSchema } from "@/lib/validators/profile.schema";

afterEach(() => vi.useRealTimers());

it("keeps birth dates optional and rejects impossible or future calendar dates", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-21T23:00:00Z"));
  for (const value of ["", "2000-02-29", "1996-10-22", "2026-10-22"])
    expect(dateOfBirthSchema.safeParse(value).success).toBe(true);
  for (const value of ["2026-10-23", "2001-02-29", "2000-02-30", "22/10/1996", "1996-10-22T00:00:00Z", null, 1996])
    expect(dateOfBirthSchema.safeParse(value).success).toBe(false);
});

it("uses India calendar dates and explicitly labels saved times, independent of browser timezone", () => {
  const instant = new Date("2026-10-21T23:00:00Z");
  expect(accountToday(instant)).toBe("2026-10-22");
  expect(accountSavedTime(instant).toLowerCase()).toMatch(/04:30\s*am ist/);
});
