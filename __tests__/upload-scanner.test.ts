// @vitest-environment node
import net from "node:net";
import { beforeAll, afterAll, expect, it, vi } from "vitest";
vi.mock("@/lib/auth", () => ({ auth: {} }));
vi.mock("@/lib/db", () => ({ db: {} }));
import { scanUpload } from "../lib/uploads/safety";
let server: net.Server, port: number, verdict = "stream: OK\0";
beforeAll(async () => {
  server = net.createServer(socket => {
    let payload = Buffer.alloc(0);
    socket.on("data", chunk => {
      payload = Buffer.concat([payload, chunk]);
      const start = Buffer.from("zINSTREAM\0"); if (payload.length < start.length + 4) return;
      expect(payload.subarray(0, start.length)).toEqual(start);
      let offset = start.length;
      while (payload.length >= offset + 4) {
        const size = payload.readUInt32BE(offset); if (!size) { socket.end(verdict); return; }
        if (payload.length < offset + 4 + size) return;
        offset += 4 + size;
      }
    });
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve)); port = (server.address() as net.AddressInfo).port;
});
afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
it("streams bounded chunks and accepts only the clean ClamD verdict", async () => {
  verdict = "stream: OK\0"; await expect(scanUpload(Buffer.alloc(150000), port)).resolves.toBeUndefined();
});
it("rejects infected uploads", async () => {
  verdict = "stream: Test-Signature FOUND\0"; await expect(scanUpload(Buffer.from("test"), port)).rejects.toMatchObject({ status: 422 });
});
it("fails closed on scanner errors", async () => {
  verdict = "INSTREAM size limit exceeded. ERROR\0"; await expect(scanUpload(Buffer.from("test"), port)).rejects.toMatchObject({ status: 503 });
});
