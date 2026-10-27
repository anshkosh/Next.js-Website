import type { Prisma } from "@prisma/client";
import { storeNotification } from "@/lib/notification-outbox";

export async function storeApprovedCommentEmail(tx: Prisma.TransactionClient, commentId: string) {
  const comment = await tx.comment.findFirst({
    where: { id: commentId, status: "APPROVED" },
    select: {
      authorName: true,
      authorEmail: true,
      authorUserId: true,
      body: true,
      startup: {
        select: {
          id: true,
          name: true,
          founder: { select: { id: true, email: true, emailVerified: true } },
        },
      },
    },
  });
  const founder = comment?.startup.founder;
  if (!comment || !founder?.emailVerified) return null;
  if (
    comment.authorUserId === founder.id ||
    comment.authorEmail.trim().toLowerCase() === founder.email.trim().toLowerCase()
  ) return null;

  return storeNotification(tx, "email", "founder_comment_approved", {
    template: "founder_comment_approved",
    to: founder.email,
    data: {
      startupId: comment.startup.id,
      startupName: comment.startup.name,
      authorName: comment.authorName,
      commentBody: comment.body,
    },
  });
}
