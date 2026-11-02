// @vitest-environment node
import { expect, it, vi } from "vitest";
import { checkPublicHealth } from "../scripts/check-public-health.mjs";

const commit = "b3bd2ef5e12f9756aa7279fecfe2e6f543fface8";
const release = { commit, builtAt: "2026-10-31T13:37:54.993Z" };
function replies(identity: unknown = release) {
  return vi.fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ status: "ok", db: "connected" }))
    .mockResolvedValueOnce(new Response("homepage"))
    .mockResolvedValueOnce(Response.json(identity));
}

it("requires database, homepage and a valid release identity before reporting success", async () => {
  const fetcher = replies();
  expect(await checkPublicHealth(fetcher)).toBe(commit);
  expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
    "https://www.anshkosh.com/api/cron/health", "https://www.anshkosh.com/",
    "https://www.anshkosh.com/.well-known/release.json",
  ]);
  for (const [, options] of fetcher.mock.calls) expect(options).toMatchObject({ cache: "no-store", signal: expect.any(AbortSignal) });
});

it("fails the reproduced healthy-database/homepage but missing-release scenario", async () => {
  const fetcher = replies();
  fetcher.mockReset()
    .mockResolvedValueOnce(Response.json({ status: "ok", db: "connected" }))
    .mockResolvedValueOnce(new Response("homepage"))
    .mockResolvedValueOnce(new Response("missing", { status: 404 }));
  await expect(checkPublicHealth(fetcher)).rejects.toThrow("release identity check failed: HTTP 404");
});

it.each([null, {}, { ...release, commit: "short" }, { ...release, commit: "g".repeat(40) }, { ...release, builtAt: "invalid" }, { commit }])(
  "rejects malformed release metadata: %j", async identity => {
    await expect(checkPublicHealth(replies(identity))).rejects.toThrow("release identity is missing or invalid");
  },
);

it("fails an HTML release response without echoing its body", async () => {
  const fetcher = replies();
  fetcher.mockReset()
    .mockResolvedValueOnce(Response.json({ status: "ok", db: "connected" }))
    .mockResolvedValueOnce(new Response("homepage"))
    .mockResolvedValueOnce(new Response("private response text"));
  await expect(checkPublicHealth(fetcher)).rejects.toThrow("release identity response is not valid JSON");
});

it.each([{ status: "ok", db: "disconnected" }, { status: "error", db: "connected" }])("retains the database failure gate: %j", async data => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(data));
  await expect(checkPublicHealth(fetcher)).rejects.toThrow("database health check failed");
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it("retains the homepage HTTP failure gate", async () => {
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ status: "ok", db: "connected" }))
    .mockResolvedValueOnce(new Response("unavailable", { status: 502 }));
  await expect(checkPublicHealth(fetcher)).rejects.toThrow("homepage check failed: HTTP 502");
});

it("reports a failed request without exposing transport details", async () => {
  const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error("private transport detail"));
  await expect(checkPublicHealth(fetcher)).rejects.toThrow("database check is unreachable");
});
