import { Worker } from "bullmq";
import { connection } from "../connection";
import { sendEmail } from "@/lib/email/adapter";
import { renderEmailTemplate, getSubject, TemplateName } from "@/lib/email/templates";
import { logger } from "@/lib/logger";
import { toPlainText } from "@react-email/components";
import { emailPreferenceAllows } from "@/lib/email/preferences";

export const emailWorker = new Worker(
  "email",
  async (job) => {
    try {
      const { template, to, data, subject: customSubject } = job.data as {
        template: TemplateName;
        to: string;
        data: Record<string, unknown>;
        subject?: string;
      };

      if (!await emailPreferenceAllows(template, to)) {
        logger.info("Email skipped by account preference", { jobId: job.id, template });
        return;
      }
      const html = await renderEmailTemplate(template, data);
      const subject = customSubject || getSubject(template, data);

      await sendEmail({ to, subject, html, text: toPlainText(html) });
      logger.info("Email sent successfully", { jobId: job.id, template });
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
