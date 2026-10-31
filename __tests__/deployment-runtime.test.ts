import { expect, it } from "vitest";
import net from "node:net";
import { assertCandidateAvailable } from "../deploy/deployment-runtime.mjs";

it("rejects a legacy PM2 app on the candidate port even under a different name", async () => {
  await expect(assertCandidateAvailable([{ name: "anshkosh-web", pm2_env: { PORT: 3000 } }], 3000, "anshkosh-web-3000")).rejects.toThrow("already registered");
  await expect(assertCandidateAvailable([{ name: "anshkosh-web-3000", pm2_env: { PORT: 3012 } }], 3000, "anshkosh-web-3000")).rejects.toThrow("already registered");
});

it("rejects an occupied OS port and allows it after the listener closes", async () => {
  const listener = net.createServer();
  await new Promise<void>(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = (listener.address() as net.AddressInfo).port;
  try {
    await expect(assertCandidateAvailable([], port, "candidate")).rejects.toThrow("already occupied");
  } finally {
    await new Promise<void>((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
  }
  await expect(assertCandidateAvailable([{ name: "live", pm2_env: { PORT: port + 1 } }], port, "candidate")).resolves.toBeUndefined();
});
