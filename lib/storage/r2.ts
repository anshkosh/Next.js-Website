import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";

export const r2 = new S3Client({
  region: "auto",
  // Isolated test server, no real storage credentials or production buckets.
  endpoint: process.env.E2E_TEST_MODE === "1" && process.env.NODE_ENV !== "production"
    ? "http://127.0.0.1:3181" : `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: process.env.E2E_TEST_MODE === "1" && process.env.NODE_ENV !== "production",
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});
