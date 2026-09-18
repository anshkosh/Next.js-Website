import { Queue } from "bullmq";
import { connection } from "./connection";

export const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 1000,
    removeOnFail: {
      age: 7 * 24 * 3600, // 7 days
    },
  },
});

export const notificationQueue = new Queue("notification", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});

export const syncQueue = new Queue("sync", {
  connection,
});
