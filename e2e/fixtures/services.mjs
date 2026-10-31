// Test-only mail/R2/ClamD protocol fixtures. Not an antivirus effectiveness test.
import http from "node:http";
import net from "node:net";
import { createRequire } from "node:module";
if (process.env.E2E_TEST_MODE !== "1" || !["localhost", "127.0.0.1"].includes(new URL(process.env.DATABASE_URL).hostname) || new URL(process.env.DATABASE_URL).pathname !== "/anshkosh_e2e") throw new Error("Test services require the isolated local anshkosh_e2e database.");
const require = createRequire(import.meta.url);
const Redis = require("ioredis");
const redis = new Redis({ host: process.env.REDIS_HOST || "127.0.0.1", port: Number(process.env.REDIS_PORT || 6379), db: 1 });
const messages = [], objects = new Map();
const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/ready") { res.end("ready"); return; }
    if (req.url === "/worker-ready") {
      // Worker heartbeat requires a live consumer; merely starting the fixture is insufficient.
      const workers = await redis.keys("bull:email:*stalled-check");
      res.statusCode = workers.length ? 200 : 503; res.end("worker"); return;
    }
    if (req.url === "/messages") { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(messages)); return; }
    let body = Buffer.alloc(0); for await (const chunk of req) body = Buffer.concat([body, chunk]);
    if (req.url === "/send" && req.method === "POST") {
      messages.push(JSON.parse(body.toString())); res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ messageId: `test-${messages.length}` })); return;
    }
    if (req.url === "/turnstile" && req.method === "POST") {
      const params = new URLSearchParams(body.toString());
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: params.get("secret") === "isolated-turnstile-test-secret" && params.get("response") === "isolated-browser-token" })); return;
    }
    const objectPath = new URL(req.url, "http://127.0.0.1:3181").pathname;
    if (req.method === "DELETE") { objects.delete(objectPath); res.statusCode = 204; res.end(); return; }
    if (req.method === "PUT") { objects.set(objectPath, { bytes: body, type: req.headers["content-type"] }); res.setHeader("ETag", '"test-etag"'); res.end(); return; }
    const object = objects.get(objectPath);
    if (object) { res.setHeader("Content-Type", object.type || "application/octet-stream"); res.end(object.bytes); return; }
    res.statusCode = 404; res.end("Not found");
  } catch { res.statusCode = 500; res.end("Test service failure"); }
});
server.listen(3181, "127.0.0.1");
const scanner = net.createServer(socket => {
  let payload = Buffer.alloc(0);
  socket.on("data", chunk => {
    payload = Buffer.concat([payload, chunk]); let offset = Buffer.byteLength("zINSTREAM\0"); const chunks = [];
    while (payload.length >= offset + 4) {
      const length = payload.readUInt32BE(offset); offset += 4;
      if (!length) { const text = Buffer.concat(chunks).toString(); socket.end(text.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE") ? "stream: Test-EICAR FOUND\0" : "stream: OK\0"); return; }
      if (payload.length < offset + length) return;
      chunks.push(payload.subarray(offset, offset + length)); offset += length;
    }
  });
});
scanner.listen(Number(process.env.CLAMAV_PORT || 33101), "127.0.0.1");
function stop() { server.close(); scanner.close(); redis.disconnect(); }
process.on("SIGTERM", stop); process.on("SIGINT", stop);
