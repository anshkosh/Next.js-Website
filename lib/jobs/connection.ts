import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || "";

export const connection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  db: process.env.NODE_ENV === "production" ? 0 : 1, // Use db 1 locally to avoid conflicting with other projects
  maxRetriesPerRequest: null,
});
