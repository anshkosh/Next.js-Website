import { connection as redis } from "@/lib/jobs/connection";

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const currentCount = await redis.incr(key);
  
  if (currentCount === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return currentCount <= limit;
}
