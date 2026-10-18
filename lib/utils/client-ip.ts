import { isIP } from "node:net";

export function clientIp(headers: Headers): string {
  // nginx overwrites X-Real-IP with $remote_addr. Never trust a client-prepended
  // X-Forwarded-For element. The production application listens on loopback.
  const ip = headers.get("x-real-ip")?.trim();
  if (ip && isIP(ip)) return ip;
  if (process.env.NODE_ENV !== "production") return "127.0.0.1";
  throw new Error("Trusted client address is unavailable");
}
