import net from "node:net";
import Redis from "ioredis";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTrustedAuthOrigins } from "@/lib/auth-origins";
import { type NextRequest, NextResponse } from "next/server";

export class UploadError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
let limiter: Redis | undefined;
export async function limitUploads(userId: string) {
  if (!limiter) {
    limiter = new Redis({ host: process.env.REDIS_HOST || "127.0.0.1", port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined, db: process.env.NODE_ENV === "production" ? 0 : 1,
      maxRetriesPerRequest: 1, connectTimeout: 2000, commandTimeout: 3000, retryStrategy: () => null });
    limiter.on("error", () => {});
  }
  const key = `upload-attempts:${createHash("sha256").update(userId).digest("hex")}`;
  try {
    const count = Number(await limiter.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],3600) end; return n", 1, key));
    if (count > 20) throw new UploadError("Upload limit reached. Try again in an hour.", 429);
  } catch (error) {
    if (error instanceof UploadError) throw error;
    limiter?.disconnect(); limiter = undefined;
    throw new UploadError("Upload protection is temporarily unavailable. Please try again shortly.");
  }
}
export async function authorizeUpload(req: NextRequest, maxBytes: number) {
  const allowed = getTrustedAuthOrigins();
  if (process.env.NODE_ENV !== "production") {
    // Next's internal development URL may use localhost even when the browser uses 127.0.0.1.
    // Accept only explicitly configured/local loopback origins, never an arbitrary request host.
    for (const value of [process.env.BETTER_AUTH_URL, req.nextUrl.origin]) {
      try {
        const url = new URL(value || "");
        if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && ["http:", "https:"].includes(url.protocol)) allowed.push(url.origin);
      } catch { /* Missing or invalid development URL adds no trust. */ }
    }
  }
  if (!allowed.includes(req.headers.get("origin") || "")) throw new UploadError("Invalid origin", 403);
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user.emailVerified || session.user.banned) throw new UploadError("Sign in with a verified account to upload files.", 401);
  if (Number(req.headers.get("content-length")) > maxBytes + 65536) throw new UploadError("This file exceeds the upload size limit.", 413);
  await limitUploads(session.user.id);
  return session.user;
}
export function scanUpload(bytes: Buffer, port = Number(process.env.CLAMAV_PORT || 3310)): Promise<void> {
  // ClamD TCP is unauthenticated. Loopback only, never an Internet listener.
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    let result = ""; let settled = false;
    const finish = (error?: UploadError) => {
      if (settled) return;
      settled = true; socket.destroy();
      if (error) reject(error); else resolve();
    };
    socket.setTimeout(10000, () => finish(new UploadError("File scanning timed out. Please try again.")));
    socket.on("error", () => finish(new UploadError("File scanning is temporarily unavailable. Please try again shortly.")));
    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      for (let offset = 0; offset < bytes.length; offset += 65536) {
        const chunk = bytes.subarray(offset, offset + 65536);
        const size = Buffer.alloc(4); size.writeUInt32BE(chunk.length);
        socket.write(size); socket.write(chunk);
      }
      socket.write(Buffer.alloc(4));
    });
    socket.on("data", data => {
      result += data.toString("utf8");
      if (result.length > 4096) return finish(new UploadError("File scanning returned an invalid response."));
      if (!result.includes("\0") && !result.includes("\n")) return;
      const verdict = result.split(/[\0\n]/)[0].trim();
      if (verdict === "stream: OK") finish();
      else if (verdict.endsWith(" FOUND")) finish(new UploadError("This file did not pass the safety scan. Choose a different file.", 422));
      else finish(new UploadError("This file could not be scanned. Choose another file or try again later."));
    });
    socket.on("end", () => { if (!settled) finish(new UploadError("File scanning ended without a result.")); });
  });
}
export async function reserveUpload(userId: string, key: string, bytes: number) {
  return db.$transaction(async tx => {
    // PostgreSQL returns void for this lock; cast so Prisma can deserialize the result.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`uploads:${userId}`}))::text`;
    const total = await tx.mediaUpload.aggregate({ where: { userId }, _sum: { bytes: true } });
    const daily = await tx.mediaUpload.aggregate({ where: { userId, createdAt: { gte: new Date(Date.now() - 86400000) } }, _sum: { bytes: true } });
    if ((total._sum.bytes || 0) + bytes > 500 * 1024 * 1024) throw new UploadError("Your account's 500 MB media allowance is full. Contact support.", 429);
    if ((daily._sum.bytes || 0) + bytes > 100 * 1024 * 1024) throw new UploadError("Your daily 100 MB upload allowance is full. Try again tomorrow.", 429);
    return tx.mediaUpload.create({ data: { userId, key, bytes } });
  });
}
export function uploadFailure(error: unknown) {
  return NextResponse.json({ error: error instanceof UploadError ? error.message : "The upload failed. Please try again." },
    { status: error instanceof UploadError ? error.status : 500 });
}
