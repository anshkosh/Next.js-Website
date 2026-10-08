// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { qpdfNormalize, type QpdfRunner } from "../lib/uploads/qpdf";
import { UploadError } from "../lib/uploads/safety";

vi.mock("ioredis", () => ({ default: class { on() {} disconnect() {} async eval() { return 1; } } }));

const pdf = Buffer.from("%PDF-1.7 original");

describe("qpdf normalisation", () => {
  it("checks first, then rewrites, and returns qpdf's output", async () => {
    const calls: string[][] = [];
    const run: QpdfRunner = async args => {
      calls.push(args);
      if (args.length === 2 && !args.includes("--check")) writeFileSync(args[1], Buffer.from("%PDF-1.7 rewritten"));
    };
    const out = await qpdfNormalize(pdf, run);
    expect(out.toString()).toBe("%PDF-1.7 rewritten");
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toBe("--check");
    expect(readFileSyncSafe(calls[0][1])).toBeNull(); // temp directory is removed afterwards
  });
  it("never passes the file contents on the command line or through a shell", async () => {
    const seen: string[][] = [];
    await qpdfNormalize(pdf, async args => { seen.push(args); if (!args.includes("--check")) writeFileSync(args[1], pdf); });
    expect(seen.flat().join(" ")).not.toContain("%PDF");
  });
  it("rejects damaged or odd PDFs (qpdf errors or warnings) with a 400 and stores nothing", async () => {
    const run: QpdfRunner = async () => { throw Object.assign(new Error("qpdf: damaged"), { code: 3 }); };
    await expect(qpdfNormalize(pdf, run)).rejects.toMatchObject({ status: 400 });
  });
  it("fails closed with a retryable 503 when the qpdf binary is missing", async () => {
    const run: QpdfRunner = async () => { throw Object.assign(new Error("spawn qpdf ENOENT"), { code: "ENOENT" }); };
    const error = await qpdfNormalize(pdf, run).catch(e => e);
    expect(error).toBeInstanceOf(UploadError);
    expect(error.status).toBe(503);
  });
  it("cleans up its temporary directory even when qpdf fails", async () => {
    let dir = "";
    const run: QpdfRunner = async args => { dir = args[1].replace(/[\/][^\/]+$/, ""); throw Object.assign(new Error("x"), { code: 2 }); };
    await qpdfNormalize(pdf, run).catch(() => undefined);
    expect(dir).not.toBe("");
    expect(existsSync(dir)).toBe(false);
  });
});

function readFileSyncSafe(file: string) { try { return readFileSync(file); } catch { return null; } }
