import { Worker } from "bullmq";
import { connection } from "../connection";
import { sendEmail } from "@/lib/email/adapter";
import { renderEmailTemplate, getSubject, TemplateName } from "@/lib/email/templates";
import { logger } from "@/lib/logger";

export const emailWorker = new Worker(
  "email",
  async (job) => {
    try {
      const { template, to, data, subject: customSubject } = job.data as {
        template: TemplateName;
        to: string;
        data: Record<string, any>;
        subject?: string;
      };

      const html = await renderEmailTemplate(template, data);
      const subject = customSubject || getSubject(template, data);

      await sendEmail({ to, subject, html });
      logger.info(`Email sent successfully to ${to}`, { jobId: job.id, template });
    } catch (error) {
      logger.error(`Failed to send email for job ${job.id}`, { error });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

emailWorker.on("failed", (job, err) => {
  logger.error(`Job ${job?.id} failed with error ${err.message}`);
});
