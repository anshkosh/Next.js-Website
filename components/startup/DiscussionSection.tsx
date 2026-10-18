"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, ChevronDown, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import TurnstileWidget from "./TurnstileWidget";
import { submitComment, fetchApprovedComments } from "@/app/actions/comment.actions";
import type { PublicComment } from "@/app/actions/comment.actions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CommentCard({ comment }: { comment: PublicComment }) {
  return (
    <div className="group">
      {/* Main comment */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-all duration-200">
        {/* Author row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold flex-shrink-0 select-none">
            {getInitials(comment.authorName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {comment.authorName}
              </span>
              <span className="text-gray-400 text-xs">{formatDate(comment.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Comment body */}
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap pl-12">
          {comment.body}
        </p>
      </div>

      {/* Founder reply — nested, one level */}
      {comment.reply && (
        <div className="ml-8 mt-2">
          <div className="relative bg-gradient-to-br from-coral-50 to-orange-50 border border-coral-200 rounded-2xl p-5 shadow-sm">
            {/* Left accent bar */}
            <div className="absolute left-0 top-4 bottom-4 w-1 bg-coral-400 rounded-full" />

            <div className="pl-3">
              {/* Founder badge row */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="w-8 h-8 rounded-full bg-coral-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  👋
                </div>
                <span className="font-semibold text-coral-800 text-sm">
                  {comment.repliedBy ?? "Founder"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-coral-100 border border-coral-200 text-coral-700 text-[11px] font-bold uppercase tracking-wide">
                  Founder
                </span>
                {comment.repliedAt && (
                  <span className="text-coral-400 text-xs ml-auto">
                    {formatDate(comment.repliedAt)}
                  </span>
                )}
              </div>

              {/* Reply body */}
              <p className="text-coral-900 text-sm leading-relaxed whitespace-pre-wrap">
                {comment.reply}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Comment Form ─────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  body: string;
  token: string;
}

function CommentForm({ startupId, startupSlug, onSubmitted }: {
  startupId: string;
  startupSlug: string;
  onSubmitted: (name: string) => void;
}) {
  const [form, setForm] = useState<FormState>({ name: "", email: "", body: "", token: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const turnstileRef = useRef<{ reset?: () => void }>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.body.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!form.token) {
      setError("Please complete the CAPTCHA challenge.");
      return;
    }

    startTransition(async () => {
      const result = await submitComment({
        startupId,
        authorName: form.name.trim(),
        authorEmail: form.email.trim(),
        body: form.body.trim(),
        turnstileToken: form.token,
      });

      if (result.error) {
        setError(result.error);
        // Reset token so user can retry
        setForm((prev) => ({ ...prev, token: "" }));
      } else {
        onSubmitted(form.name.trim());
        setForm({ name: "", email: "", body: "", token: "" });
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-5">Leave a Comment</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name + Email row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="comment-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="comment-name"
              name="name"
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={80}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label htmlFor="comment-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-400">*</span>
              <span className="text-gray-400 font-normal ml-1">(private, never shown)</span>
            </label>
            <input
              id="comment-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              maxLength={254}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="comment-body" className="block text-sm font-medium text-gray-700 mb-1.5">
            Comment <span className="text-red-400">*</span>
          </label>
          <textarea
            id="comment-body"
            name="body"
            rows={4}
            placeholder="Share your thoughts, questions, or feedback..."
            value={form.body}
            onChange={handleChange}
            required
            maxLength={2000}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent resize-none transition-all"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {form.body.length}/2000
          </div>
        </div>

        {/* Turnstile */}
        <TurnstileWidget
          onToken={(token) => setForm((prev) => ({ ...prev, token }))}
          onExpire={() => setForm((prev) => ({ ...prev, token: "" }))}
        />

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={isPending || !form.token}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Comment
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Comments are reviewed before appearing publicly
          </p>
        </div>
        <p className="text-xs leading-relaxed text-gray-500">
          Your name and comment may be published after moderation. Your email stays private. See our{" "}
          <Link href="/privacy" className="font-medium text-coral-700 underline underline-offset-2">Privacy Notice</Link>.
        </p>
      </form>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DiscussionSectionProps {
  startupId: string;
  startupSlug: string;
  initialComments: PublicComment[];
  initialNextCursor: string | null;
  totalApprovedCount: number;
}

export default function DiscussionSection({
  startupId,
  startupSlug,
  initialComments,
  initialNextCursor,
  totalApprovedCount,
}: DiscussionSectionProps) {
  const [comments, setComments] = useState<PublicComment[]>(initialComments);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoadingMore, startLoadMore] = useTransition();
  const [submitted, setSubmitted] = useState<string | null>(null); // commenter name after success

  const handleLoadMore = useCallback(() => {
    if (!nextCursor) return;
    startLoadMore(async () => {
      const { comments: more, nextCursor: newCursor } =
        await fetchApprovedComments(startupId, nextCursor);
      setComments((prev) => [...prev, ...more]);
      setNextCursor(newCursor);
    });
  }, [startupId, nextCursor]);

  const handleSubmitted = (name: string) => {
    setSubmitted(name);
  };

  return (
    <div className="bg-gray-50/80 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-6 border-b border-gray-100 bg-white">
        <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-coral-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">Discussion</h2>
          {totalApprovedCount > 0 && (
            <p className="text-sm text-gray-500">
              {totalApprovedCount} comment{totalApprovedCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Comments feed */}
        {comments.length === 0 && !submitted ? (
          <div className="text-center py-10 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">No comments yet</p>
            <p className="text-sm mt-1">Be the first to start the discussion!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        )}

        {/* Load More */}
        {nextCursor && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-coral-600 bg-coral-50 hover:bg-coral-100 disabled:opacity-50 rounded-xl transition-colors"
            >
              {isLoadingMore ? (
                <span className="w-4 h-4 border-2 border-coral-300 border-t-coral-600 rounded-full animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Load More Comments
            </button>
          </div>
        )}

        {/* Post-submit success banner */}
        {submitted && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-700">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
            <span>
              Thanks, <strong>{submitted}</strong>! Your comment has been submitted and will appear after review.
            </span>
          </div>
        )}

        {/* Comment form */}
        {!submitted && (
          <CommentForm
            startupId={startupId}
            startupSlug={startupSlug}
            onSubmitted={handleSubmitted}
          />
        )}

        {/* Allow posting another after success */}
        {submitted && (
          <div className="text-center">
            <button
              onClick={() => setSubmitted(null)}
              className="text-sm text-coral-600 hover:underline"
            >
              Post another comment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
