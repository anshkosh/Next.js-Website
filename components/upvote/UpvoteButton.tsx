"use client";

import { useId, useOptimistic, useTransition, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toggleVote } from "@/app/actions/upvote.actions";
import { signalCount, voteTransition, type VoteDirection } from "@/lib/voting";

function compactCount(value: number) {
  return Math.abs(value) >= 1000
    ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)
    : value.toLocaleString("en-IN");
}

export default function UpvoteButton({ startupId, startupName, initialCount, initialDownvotes, initialUpvoted, initialDownvoted }: {
  startupId: string; startupName?: string; initialCount: number; initialDownvotes: number;
  initialUpvoted: boolean; initialDownvoted: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState({ upvoteCount: initialCount, downvoteCount: initialDownvotes, vote: (initialUpvoted ? 1 : initialDownvoted ? -1 : 0) as VoteDirection });
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const [optimistic, addOptimistic] = useOptimistic(saved, (state, direction: -1 | 1) => {
    const { next, upvoteDelta, downvoteDelta } = voteTransition(state.vote, direction);
    return { vote: next, upvoteCount: state.upvoteCount + upvoteDelta, downvoteCount: state.downvoteCount + downvoteDelta };
  });
  function vote(event: React.MouseEvent, direction: -1 | 1) {
    event.preventDefault();
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      addOptimistic(direction);
      try {
        const result = await toggleVote(startupId, direction);
        if (result.success) setSaved({ vote: result.vote, upvoteCount: result.upvoteCount, downvoteCount: result.downvoteCount });
        else setError(result.error || "Your vote could not be saved. Please try again.");
      } catch { setError("Your vote could not be saved. Please try again."); }
    });
  }
  const name = startupName ? ` for ${startupName}` : "";
  return (
    <div className="flex w-32 flex-col items-center gap-1">
      <div className="flex w-full items-center rounded-xl border border-gray-200 bg-white">
        <button type="button" onClick={event => vote(event, 1)} disabled={isPending} aria-pressed={optimistic.vote === 1} aria-busy={isPending} aria-describedby={error ? errorId : undefined}
          aria-label={`${optimistic.vote === 1 ? "Remove upvote" : "Upvote"}${name}, ${optimistic.upvoteCount} upvotes`}
          className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-l-xl transition-colors disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600 ${optimistic.vote === 1 ? "bg-coral-50 text-coral-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <ChevronUp aria-hidden="true" className="h-4 w-4" />
          <span aria-hidden="true" className="text-[10px] font-medium tabular-nums">{compactCount(optimistic.upvoteCount)}</span>
        </button>
        <span role="status" aria-live="polite" aria-atomic="true" className="min-w-0 flex-1 text-center text-sm font-semibold tabular-nums text-gray-900" title={`${optimistic.upvoteCount} upvotes − ${optimistic.downvoteCount} downvotes`}>
          <span className="sr-only">{startupName ? `${startupName}: ` : ""}</span>{compactCount(signalCount(optimistic))}<span className="sr-only"> signals, {optimistic.upvoteCount} upvotes minus {optimistic.downvoteCount} downvotes</span>
        </span>
        <button type="button" onClick={event => vote(event, -1)} disabled={isPending} aria-pressed={optimistic.vote === -1} aria-busy={isPending} aria-describedby={error ? errorId : undefined}
          aria-label={`${optimistic.vote === -1 ? "Remove downvote" : "Downvote"}${name}, ${optimistic.downvoteCount} downvotes`}
          className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-r-xl transition-colors disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600 ${optimistic.vote === -1 ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
          <span aria-hidden="true" className="text-[10px] font-medium tabular-nums">{compactCount(optimistic.downvoteCount)}</span>
        </button>
      </div>
      <span className="text-[11px] text-gray-600">Signals</span>
      {error && <p id={errorId} role="alert" className="text-center text-xs leading-relaxed text-red-600">{error}</p>}
    </div>
  );
}
