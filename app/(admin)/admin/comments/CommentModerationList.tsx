"use client";

import { useTransition, useState } from "react";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { approveComment, rejectComment } from "@/app/actions/comment.actions";

interface AdminComment {
  id: string;
  authorName: string;
  authorEmail: string;
  body: string;
  createdAt: string;
  startup: {
    id: string;
    name: string;
    slug: string;
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentModerationRow({ comment }: { comment: AdminComment }) {
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    startApprove(async () => {
      const result = await approveComment(comment.id);
      if (result.error) setError(result.error);
      else setDone("approved");
    });
  };

  const handleReject = () => {
    startReject(async () => {
      const result = await rejectComment(comment.id);
      if (result.error) setError(result.error);
      else setDone("rejected");
    });
  };

  if (done === "approved") {
    return (
      <div className="flex items-center gap-2 px-5 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        Comment by <strong className="mx-1">{comment.authorName}</strong> approved and now live.
      </div>
    );
  }

  if (done === "rejected") {
    return (
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500">
        <XCircle className="w-4 h-4 flex-shrink-0" />
        Comment by <strong className="mx-1">{comment.authorName}</strong> rejected.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Meta */}
      <div className="flex items-start gap-3 justify-between flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{comment.authorName}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-sm text-gray-500">{comment.authorEmail}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>on</span>
            <Link
              href={`/startups/${comment.startup.slug}`}
              target="_blank"
              className="text-coral-600 hover:underline flex items-center gap-1"
            >
              {comment.startup.name}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Comment body */}
      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        {comment.body}
      </p>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isApproving ? "Approving…" : "Approve"}
        </button>
        <button
          onClick={handleReject}
          disabled={isRejecting || isApproving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
        >
          <XCircle className="w-4 h-4" />
          {isRejecting ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </div>
  );
}

export default function CommentModerationList({ comments }: { comments: AdminComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-xl font-bold mb-2">Queue is empty!</h2>
        <p className="text-gray-500">There are no comments pending review right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <CommentModerationRow key={c.id} comment={c} />
      ))}
    </div>
  );
}
