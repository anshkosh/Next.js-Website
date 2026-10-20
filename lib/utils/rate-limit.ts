import Redis from "ioredis";

let limiter: Redis | undefined;
function rateLimiter() {
  if (!limiter) {
    limiter = new Redis({ host: process.env.REDIS_HOST || "127.0.0.1", port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined, db: process.env.NODE_ENV === "production" ? 0 : 1,
      maxRetriesPerRequest: 1, connectTimeout: 2000, commandTimeout: 3000, retryStrategy: () => null });
    limiter.on("error", () => {});
  }
  return limiter;
}

export async function readRateLimit(key: string, limit: number): Promise<{ allowed: boolean; available: boolean; retryAfterSeconds: number }> {
  try {
    const [count, ttl] = await rateLimiter().eval("return {redis.call('GET',KEYS[1]) or '0',redis.call('TTL',KEYS[1])}", 1, key) as [string, number];
    return { allowed: Number(count) < limit, available: true, retryAfterSeconds: Math.max(1, Number(ttl)) };
  } catch {
    limiter?.disconnect(); limiter = undefined;
    return { allowed: false, available: false, retryAfterSeconds: 60 };
  }
}

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const count = Number(await rateLimiter().eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n", 1, key, windowSeconds));
    return count <= limit;
  } catch {
    limiter?.disconnect(); limiter = undefined;
    return false;
  }
}
