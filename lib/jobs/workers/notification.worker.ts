import { Worker } from "bullmq";
import { connection } from "../connection";
import { emailQueue } from "../queues";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const notificationWorker = new Worker(
  "notification",
  async (job) => {
    if (job.name === "new_submission") {
      try {
        const { startupName, founderName, category } = job.data;

        // Fetch all admins and reviewers
        const admins = await db.user.findMany({
          where: {
            role: { in: ["admin", "reviewer"] },
          },
          select: { email: true },
        });

        if (admins.length === 0) {
          logger.info("No admins found to notify for new submission.");
          return;
        }

        const emailJobs = admins.map((admin) => ({
          name: "admin_notification",
          data: {
            template: "new_submission",
            to: admin.email,
            data: { startupName, founderName, category },
          },
        }));

        await emailQueue.addBulk(emailJobs);
        logger.info(`Enqueued ${emailJobs.length} new_submission emails.`, { jobId: job.id });
      } catch (error) {
        logger.error(`Failed to process notification for job ${job.id}`, { error });
        throw error;
      }
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

notificationWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed with error ${err.message}`);
});
