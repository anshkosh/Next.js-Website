// @vitest-environment node
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { formatJournalDate } from "@/lib/journal-dates";

const cases = [
  ["2026-11-19T18:29:59.999Z", "19 November 2026"],
  ["2026-11-19T18:30:00.000Z", "20 November 2026"],
  ["2026-11-20T03:27:18.773Z", "20 November 2026"],
  ["2026-11-20T18:30:00.000Z", "21 November 2026"],
  ["2026-12-31T18:30:00.000Z", "1 January 2027"],
  ["2028-02-28T18:30:00.000Z", "29 February 2028"],
];

for (const timeZone of ["America/Denver", "UTC", "Asia/Kolkata"]) {
  it(`renders India's calendar dates on a ${timeZone} host`, () => {
    const script = `
      import { formatJournalDate } from './lib/journal-dates.ts';
      const instants = ${JSON.stringify(cases.map(([instant]) => instant))};
      process.stdout.write(JSON.stringify(instants.map(value => formatJournalDate(new Date(value)))));
    `;
    const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], {
      cwd: process.cwd(), env: { ...process.env, TZ: timeZone },
      encoding: "utf8", timeout: 10_000, maxBuffer: 64 * 1024,
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(cases.map(([, expected]) => expected));
  }, 15_000);
}

it("does not change the instant used by stored and structured dates", () => {
  const instant = "2026-11-20T03:27:18.773Z";
  const date = new Date(instant);
  expect(formatJournalDate(date)).toBe("20 November 2026");
  expect(date.toISOString()).toBe(instant);
});
