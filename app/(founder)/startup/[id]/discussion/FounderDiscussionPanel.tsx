"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Save, Trash2, CheckCircle2, AlertCircle, CornerDownRight } from "lucide-react";
import { replyToComment, deleteReply } from "@/app/actions/comment.actions";

interface ApprovedComment {
  id: string;
  authorName: string;
  body: string;
  reply: string | null;
  repliedBy: string | null;
  repliedAt: string | null;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function CommentReplyRow({ comment }: { comment: ApprovedComment }) {
  const [replyText, setReplyText] = useState(comment.reply ?? "");
  const [savedReply, setSavedReply] = useState(comment.reply ?? "");
  const [isSaving, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const isDirty = replyText.trim() !== savedReply.trim();

  const handleSave = () => {
    if (!replyText.trim()) return;
    setFeedback(null);
    startSave(async () => {
      const result = await replyToComment({ commentId: comment.id, reply: replyText.trim() });
      if (result.error) {
        setFeedback({ type: "error", msg: result.error });
      } else {
        setSavedReply(replyText.trim());
        setFeedback({ type: "success", msg: "Reply saved and now live." });
      }
    });
  };

  const handleDelete = () => {
    setFeedback(null);
    startDelete(async () => {
      const result = await deleteReply(comment.id);
      if (result.error) {
        setFeedback({ type: "error", msg: result.error });
      } else {
        setReplyText("");
        setSavedReply("");
        setFeedback({ type: "success", msg: "Reply deleted." });
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Comment from visitor */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-gray-900 text-sm">{comment.authorName}</span>
          <span className="text-gray-400 text-xs">· {formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap pl-10">
          {comment.body}
        </p>
      </div>

      {/* Founder reply editor */}
      <div className="pl-4 border-l-2 border-coral-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-coral-600 uppercase tracking-wide">
          <CornerDownRight className="w-3.5 h-3.5" />
          Your Reply
        </div>
        <textarea
          rows={3}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write a reply as the founder…"
          maxLength={2000}
          className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent resize-none transition-all"
        />
        <div className="text-right text-xs text-gray-400">{replyText.length}/2000</div>

        {/* Feedback */}
        {feedback && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {feedback.msg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || isDeleting || !replyText.trim() || !isDirty}
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving…" : savedReply ? "Update Reply" : "Post Reply"}
          </button>

          {savedReply && (
            <button
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-semibold rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting…" : "Delete Reply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FounderDiscussionPanel({ comments }: { comments: ApprovedComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium text-gray-500 text-lg">No comments yet</p>
        <p className="text-sm mt-2 text-gray-400">
          Approved visitor comments will appear here once your admin reviews them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {comments.map((c) => (
        <CommentReplyRow key={c.id} comment={c} />
      ))}
    </div>
  );
}
