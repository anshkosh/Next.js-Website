import Redis from "ioredis";

// Separate from queue/rate-limit connections: an optional cache must fail open
// quickly without weakening those protections or delaying a database fallback.
let connection: Redis | undefined;
let retryAfter = 0;

function client() {
  if (Date.now() < retryAfter) throw new Error("Public cache unavailable");
  if (!connection) {
    connection = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.NODE_ENV === "production" ? 0 : 1,
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      connectTimeout: 200,
      commandTimeout: 200,
      retryStrategy: () => null,
    });
    connection.on("error", () => {});
  }
  return connection;
}

function unavailable() {
  // Requests during a cooldown must not keep pushing its deadline forward.
  if (!connection) return;
  connection.disconnect();
  connection = undefined;
  retryAfter = Date.now() + 5000;
}

export interface PublicCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
}

export const publicCache: PublicCache = {
  async get(key) {
    try { return await client().get(key); }
    catch { unavailable(); throw new Error("Public cache unavailable"); }
  },
  async set(key, value, ttlMs) {
    try { await client().set(key, value, "PX", ttlMs); }
    catch { unavailable(); /* The database result remains valid. */ }
  },
};
