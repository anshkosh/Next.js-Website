// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
vi.mock("../lib/public-cache", () => ({ publicCache: {} }));
import { publicSignals } from "../lib/public-signals";
import type { PublicCache } from "../lib/public-cache";

const now = new Date("2026-10-26T06:00:00Z");
const row = { id: "public-startup", name: "Public startup", featured: false, upvoteCount: 2, downvoteCount: 0, updateCount: 1, founderDays: 1, backers: 0, discussions: 0 };
let version: string;
let rows: typeof row[];
let nextChange: Date | null;
let values: Map<string, string>;
let store: PublicCache;
let query: ReturnType<typeof vi.fn>;
let tx: Pick<Prisma.TransactionClient, "$queryRaw">;

beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(now);
  version = "100:100:"; rows = [row]; nextChange = null; values = new Map();
  store = { get: vi.fn(async key => values.get(key) ?? null), set: vi.fn(async (key, value) => { values.set(key, value); }) };
  query = vi.fn(async (sql: Prisma.Sql | TemplateStringsArray) => {
    const text = "text" in sql ? sql.text : sql.join("");
    if (text.includes("txid_current_snapshot")) return [{ snapshot: version, database: "fixture", schema: "public" }];
    if (text.includes('AS "nextChange"')) return [{ nextChange }];
    return rows;
  });
  tx = { $queryRaw: query } as unknown as Pick<Prisma.TransactionClient, "$queryRaw">;
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it("reuses only public aggregate rows for the same committed database snapshot", async () => {
  expect(await publicSignals(tx, store)).toEqual([row]);
  expect(await publicSignals(tx, store)).toEqual([row]);
  expect(query).toHaveBeenCalledTimes(4); // stamp + aggregate + boundary, then stamp only
  expect(store.set).toHaveBeenCalledWith(expect.stringMatching(/^anshkosh:public-signals:v1:/), expect.any(String), 15000);
  const payload = [...values.values()][0];
  for (const privateField of ["cookieId", "email", "session", "upvotes", "downvotes"]) expect(payload).not.toContain(`"${privateField}"`);
});
it("does not reuse a previous result after a write is visible, including founder-mode changes", async () => {
  await publicSignals(tx, store);
  version = "101:101:"; rows = [];
  expect(await publicSignals(tx, store)).toEqual([]);
  expect(store.set).toHaveBeenCalledTimes(2);
  expect(vi.mocked(store.set).mock.calls[0][0]).not.toBe(vi.mocked(store.set).mock.calls[1][0]);
});
it("does not mix snapshots while another transaction is still active", async () => {
  await publicSignals(tx, store);
  version = "100:102:100";
  await publicSignals(tx, store);
  version = "100:102:";
  await publicSignals(tx, store);
  expect(new Set((store.set as ReturnType<typeof vi.fn>).mock.calls.map(call => call[0])).size).toBe(3);
});
it("expires exactly at a scheduled publication or feature boundary, even without writes", async () => {
  nextChange = new Date(now.getTime() + 2000);
  await publicSignals(tx, store);
  expect(store.set).toHaveBeenLastCalledWith(expect.any(String), expect.any(String), 2000);
  vi.setSystemTime(nextChange); rows = [{ ...row, featured: true, founderDays: 2 }]; nextChange = null;
  expect(await publicSignals(tx, store)).toEqual(rows);
  expect(query).toHaveBeenCalledTimes(6);
});
it("expires old snapshots after 15 seconds and rejects future-dated cache results", async () => {
  await publicSignals(tx, store);
  vi.setSystemTime(now.getTime() - 1);
  await publicSignals(tx, store);
  expect(query).toHaveBeenCalledTimes(6);
  vi.setSystemTime(now.getTime() + 15000);
  await publicSignals(tx, store);
  expect(query).toHaveBeenCalledTimes(9);
});
it.each(["not-json", JSON.stringify({ readAt: now.getTime(), expiresAt: now.getTime() + 15000, rows: [{ ...row, upvoteCount: -1 }] })])("replaces a malformed cache entry", async value => {
  store.get = vi.fn(async () => value);
  expect(await publicSignals(tx, store)).toEqual([row]);
  expect(query).toHaveBeenCalledTimes(3);
});
it("falls back to a fresh database read when Redis is unavailable", async () => {
  store.get = vi.fn().mockRejectedValue(new Error("offline"));
  expect(await publicSignals(tx, store)).toEqual([row]);
  expect(query).toHaveBeenCalledTimes(2);
  expect(store.set).not.toHaveBeenCalled();
});
it("does not turn a successful database read into an error when cache writes fail", async () => {
  store.set = vi.fn().mockRejectedValue(new Error("offline"));
  expect(await publicSignals(tx, store)).toEqual([row]);
});
