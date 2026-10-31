import Redis from "ioredis";
import { isolatedE2E } from "../isolated-e2e";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || "";

export const connection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  db: process.env.NODE_ENV === "production" && !isolatedE2E() ? 0 : 1,
  maxRetriesPerRequest: null,
});
