// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { restoreDatabase } from "../deploy/isolated-restore.mjs";
let directory: string;
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "anshkosh-restore-unit-"));
  fs.writeFileSync(path.join(directory, "retained.dump"), "retain this backup");
});
afterEach(() => {
  const target = fs.realpathSync(directory);
  if (path.dirname(target) !== fs.realpathSync(os.tmpdir()) || !path.basename(target).startsWith("anshkosh-restore-unit-")) throw new Error("Unsafe test cleanup");
  fs.rmSync(target, { recursive: true });
});
it("restores only through a new private socket, verifies tables and stops before cleanup", () => {
  const run = vi.fn((_binary: string, args: string[]) => args.includes("-Atc") ? "5|2\n" : "");
  expect(restoreDatabase(Buffer.from("dump"), directory, run)).toBe("5|2");
  const start = run.mock.calls.find(([, args]) => args.includes("start"))!;
  expect(start[1].at(-1)).toContain("listen_addresses=''");
  expect(start[1].at(-1)).toContain("shared_buffers=32MB");
  const restore = run.mock.calls.find(([binary]) => binary.endsWith("pg_restore"))!;
  expect(restore[1]).toContain("--no-owner");
  expect(restore[1].at(-1)).toMatch(/^anshkosh_restore_[a-f0-9]{16}$/);
  expect(run.mock.calls.at(-1)![1]).toContain("stop");
  expect(fs.readdirSync(directory)).toEqual(["retained.dump"]);
});
it("still stops and cleans only its scratch directory after a restore failure", () => {
  const run = vi.fn((binary: string) => { if (binary.endsWith("pg_restore")) throw new Error("bad dump"); return ""; });
  expect(() => restoreDatabase(Buffer.from("dump"), directory, run)).toThrow("bad dump");
  expect(run.mock.calls.at(-1)![0]).toContain("pg_ctl");
  expect(fs.readdirSync(directory)).toEqual(["retained.dump"]);
});
it("does not delete a cluster when stopping it fails", () => {
  const run = vi.fn((_binary: string, args: string[]) => { if (args.includes("stop")) throw new Error("stop failed"); return args.includes("-Atc") ? "5|2" : ""; });
  expect(() => restoreDatabase(Buffer.from("dump"), directory, run)).toThrow("stop failed");
  expect(fs.readdirSync(directory).some(name => name.startsWith("restore-test-"))).toBe(true);
  expect(fs.readFileSync(path.join(directory, "retained.dump"), "utf8")).toBe("retain this backup");
});
