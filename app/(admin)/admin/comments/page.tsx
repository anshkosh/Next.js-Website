import { db } from "@/lib/db";
import { MessageSquare } from "lucide-react";
import CommentModerationList from "./CommentModerationList";

export default async function CommentsPage() {
  const pendingComments = await db.comment.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" }, // oldest first (FIFO queue)
    include: {
      startup: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-8 w-8 text-coral-500" />
        <h1 className="text-3xl font-bold font-heading">Comment Moderation</h1>
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold ml-2">
          {pendingComments.length} Pending
        </span>
      </div>

      <CommentModerationList
        comments={pendingComments.map((c) => ({
          id: c.id,
          authorName: c.authorName,
          authorEmail: c.authorEmail,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          startup: c.startup,
        }))}
      />
    </div>
  );
}
