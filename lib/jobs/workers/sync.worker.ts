import { Worker } from "bullmq";
import { connection } from "../connection";
import { syncQueue } from "../queues";
import { recountVotes } from "@/lib/vote-store";
import { logger } from "@/lib/logger";

export const syncWorker = new Worker(
  "sync",
  async (job) => {
    if (job.name === "upvote-count-sync") {
      try {
        logger.info("Starting upvote-count-sync job...");
        
        const result = await recountVotes();

        logger.info(`upvote-count-sync completed successfully. Rows affected: ${result}`, { jobId: job.id });
      } catch (error) {
        logger.error(`Failed upvote-count-sync job ${job.id}`, { error });
        throw error;
      }
    }
  },
  {
    connection,
    concurrency: 1,
  }
);

syncWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed with error ${err.message}`);
});

// Register repeatable job
async function registerSyncJob() {
  await syncQueue.upsertJobScheduler(
    "upvote-count-sync",
    {
      pattern: "0 3 * * *", // 3 AM daily
    },
    {
      name: "upvote-count-sync",
      data: {}
    }
  );
  logger.info("Registered repeatable upvote-count-sync job");
}

registerSyncJob().catch((err) => logger.error("Failed to register sync job", { err }));
