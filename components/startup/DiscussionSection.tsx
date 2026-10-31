"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, ChevronDown, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import TurnstileWidget from "./TurnstileWidget";
import { submitComment, fetchApprovedComments, getCommentAvailability } from "@/app/actions/comment.actions";
import type { PublicComment, PendingComment } from "@/app/actions/comment.actions";
import { characterCount, limitCharacters } from "@/lib/characters";
import { commentLanguageReasons, COMMENT_LANGUAGE_WARNING } from "@/lib/comment-language";
import CommentActions from "@/components/startup/CommentActions";

type CommentAvailability = Awaited<ReturnType<typeof getCommentAvailability>>;
type CommentViewer = { name: string; email: string };

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

function CommentCard({ comment, replyHref, onEdited, onDeleted }: {
  comment: PublicComment;
  replyHref?: string;
  onEdited: (comment: PendingComment) => void;
  onDeleted: (commentId: string) => void;
}) {
  return (
    <div className="group">
      {/* Main comment */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-gray-200 hover:shadow-md transition-[border-color,box-shadow] duration-(--duration-quick)">
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
              <span className="text-gray-500 text-xs">{formatDate(comment.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Comment body */}
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap pl-12">
          {comment.body}
        </p>
        {comment.canManage && <div className="mt-3 pl-12"><CommentActions comment={comment} onEdited={onEdited} onDeleted={onDeleted} /></div>}
      </div>

      {/* Founder reply — nested, one level */}
      {replyHref && <Link href={replyHref} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-coral-700 underline underline-offset-4">{comment.reply ? "Edit founder reply" : "Reply as founder"}</Link>}
      {comment.reply && (
        <div className="ml-8 mt-2">
          <div className="relative bg-gradient-to-br from-coral-50 to-orange-50 border border-coral-200 rounded-2xl p-5 shadow-sm">
            {/* Left accent bar */}
            <div className="absolute left-0 top-4 bottom-4 w-1 bg-coral-400 rounded-full" />

            <div className="pl-3">
              {/* Founder badge row */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="w-8 h-8 rounded-full bg-coral-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  👋
                </div>
                <span className="font-semibold text-coral-800 text-sm">
                  {comment.repliedBy ?? "Founder"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-coral-100 border border-coral-200 text-coral-700 text-[11px] font-bold uppercase tracking-wide">
                  Founder
                </span>
                {comment.repliedAt && (
                  <time dateTime={comment.repliedAt} title={new Date(comment.repliedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"} className="text-coral-700 text-xs ml-auto">
                    Reply updated {formatDate(comment.repliedAt)}
                  </time>
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

function CommentForm({ startupId, viewer, availability, setAvailability, onSubmitted }: {
  startupId: string;
  viewer?: CommentViewer;
  availability: CommentAvailability;
  setAvailability: (status: CommentAvailability) => void;
  onSubmitted: (comment: PendingComment, warning?: string) => void;
}) {
  const [form, setForm] = useState<FormState>({ name: viewer?.name ?? "", email: viewer?.email ?? "", body: "", token: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [captchaAttempt, setCaptchaAttempt] = useState(0);

  const checkAvailability = () => startTransition(async () => {
    try { setAvailability(await getCommentAvailability()); }
    catch { setError("Could not check comment availability. Please try again."); }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.name === "body" ? limitCharacters(e.target.value, 2000) : e.target.value }));
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
      try {
        const result = await submitComment({
          startupId,
          authorName: form.name.trim(),
          authorEmail: form.email.trim(),
          body: form.body.trim(),
          turnstileToken: form.token,
        });

        if (result.error) {
          setError(result.error);
          setAvailability(await getCommentAvailability());
        } else if (result.pendingComment) {
          onSubmitted(result.pendingComment, result.warning);
          setForm({ name: viewer?.name ?? "", email: viewer?.email ?? "", body: "", token: "" });
        }
      } catch {
        setError("We could not confirm your submission. Refresh to check your pending comments before trying again.");
      } finally {
        // Turnstile tokens are single-use, including after a failed submission.
        setForm(prev => ({ ...prev, token: "" }));
        setCaptchaAttempt(attempt => attempt + 1);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-5">Leave a Comment</h3>

      {viewer && <p className="mb-4 text-sm text-gray-600">Signed in as <strong>{viewer.name}</strong>. Your email stays private.</p>}
      <form method="post" onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition-[border-color,box-shadow]"
            />
          </div>
          <div>
            <label htmlFor="comment-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-400">*</span>
              <span className="text-gray-500 font-normal ml-1">(private, never shown)</span>
            </label>
            <input
              id="comment-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              readOnly={Boolean(viewer)}
              maxLength={254}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition-[border-color,box-shadow] read-only:cursor-not-allowed read-only:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">To edit or delete later, sign in with a verified Anshkosh account using this email.</p>
          </div>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="comment-body" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your question or feedback <span className="text-red-400">*</span>
          </label>
          <textarea
            id="comment-body"
            name="body"
            rows={4}
            placeholder="What would you want to know before trying this? What feels unclear or could be more useful?"
            value={form.body}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent resize-none transition-[border-color,box-shadow]"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {characterCount(form.body)}/2000
          </div>
          {commentLanguageReasons(`${form.name}\n${form.body}`).length > 0 && <p role="status" className="mt-2 text-sm text-amber-900">{COMMENT_LANGUAGE_WARNING}</p>}
        </div>

        {/* Turnstile */}
        <p className="text-xs text-gray-500">Up to 3 comments per hour from this network. Each comment is reviewed before publication.</p>
        {availability.allowed ? <TurnstileWidget
          key={captchaAttempt}
          onToken={(token) => setForm((prev) => ({ ...prev, token }))}
          onExpire={() => setForm((prev) => ({ ...prev, token: "" }))}
        /> : <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>{availability.message}</p>
          {availability.available && <p className="mt-1">Try again in about {Math.ceil(availability.retryAfterSeconds / 60)} minutes.</p>}
          <button type="button" disabled={isPending} onClick={checkAvailability} className="mt-2 min-h-11 font-semibold underline">Check availability again</button>
        </div>}
        {availability.allowed && !form.token && <p role="status" className="text-sm text-gray-600">The security check loads here automatically. If a challenge appears, complete it to post.</p>}

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={isPending || !form.token || !availability.allowed || !form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || characterCount(form.body.trim()) < 5}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-coral-600 hover:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post feedback
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
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
  initialComments: PublicComment[];
  initialNextCursor: string | null;
  totalApprovedCount: number;
  viewer?: CommentViewer;
  isOwner?: boolean;
  initialAvailability: CommentAvailability;
  initialPendingComments: PendingComment[];
}

export default function DiscussionSection({
  startupId,
  initialComments,
  initialNextCursor,
  totalApprovedCount,
  viewer,
  isOwner = false,
  initialAvailability,
  initialPendingComments,
}: DiscussionSectionProps) {
  const [comments, setComments] = useState<PublicComment[]>(initialComments);
  const [approvedCount, setApprovedCount] = useState(totalApprovedCount);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoadingMore, startLoadMore] = useTransition();
  const [submitted, setSubmitted] = useState<string | null>(null); // commenter name after success
  const [submissionWarning, setSubmissionWarning] = useState<string | undefined>();
  const [pendingComments, setPendingComments] = useState(initialPendingComments);
  const [availability, setAvailability] = useState(initialAvailability);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor) return;
    startLoadMore(async () => {
      const { comments: more, nextCursor: newCursor } =
        await fetchApprovedComments(startupId, nextCursor);
      setComments((prev) => [...prev, ...more]);
      setNextCursor(newCursor);
    });
  }, [startupId, nextCursor]);

  const handleSubmitted = (comment: PendingComment, warning?: string) => {
    setSubmitted(comment.authorName);
    setSubmissionWarning(warning);
    setPendingComments(previous => [comment, ...previous.filter(item => item.id !== comment.id)]);
    setAvailability({ allowed: false, available: false, retryAfterSeconds: 1, message: "Checking comment availability…" });
    getCommentAvailability().then(setAvailability).catch(() => setAvailability({ allowed: false, available: false, retryAfterSeconds: 60, message: "Could not check comment availability. Please try again." }));
  };

  return (
    <div className="bg-gray-50/80 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-6 sm:px-8 border-b border-gray-100 bg-white">
        <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-coral-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">Questions &amp; feedback</h2>
          {approvedCount > 0 && (
            <p className="text-sm text-gray-500">
              {approvedCount} comment{approvedCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-8 space-y-6">
        {pendingComments.length > 0 && <section aria-label="Your pending comments" className="space-y-3">
          <h3 className="font-semibold text-gray-900">Your pending comments</h3>
          <p className="text-xs text-gray-600">These comments stay private until they pass review. Sign in with the verified email you used to post to edit or delete them.</p>
          {pendingComments.map(comment => <div key={comment.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">{comment.authorName} · Awaiting review</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">{comment.body}</p>
            {comment.canManage && <div className="mt-3"><CommentActions comment={comment} onEdited={updated => setPendingComments(previous => [updated, ...previous.filter(item => item.id !== updated.id)])} onDeleted={id => setPendingComments(previous => previous.filter(item => item.id !== id))} /></div>}
          </div>)}
        </section>}
        {/* Comments feed */}
        {comments.length === 0 && !submitted && pendingComments.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">No feedback yet</p>
            <p className="text-sm mt-1">Be the first to share a specific question, concern, or suggestion that could help the founder improve this idea.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} onEdited={updated => {
                setComments(previous => previous.filter(item => item.id !== updated.id));
                setApprovedCount(count => Math.max(0, count - 1));
                setPendingComments(previous => [updated, ...previous.filter(item => item.id !== updated.id)]);
              }} onDeleted={id => { setComments(previous => previous.filter(item => item.id !== id)); setApprovedCount(count => Math.max(0, count - 1)); }} replyHref={isOwner ? `/startup/${startupId}/discussion#comment-${comment.id}` : undefined} />
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
        {submitted && submissionWarning && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">Your comment is held for human review. {submissionWarning}</p>}
        {submitted && !submissionWarning && (
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
            key={viewer?.email ?? "guest"}
            startupId={startupId}
            viewer={viewer}
            availability={availability}
            setAvailability={setAvailability}
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
