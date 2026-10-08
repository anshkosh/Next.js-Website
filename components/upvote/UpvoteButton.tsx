"use client";

import { useId, useOptimistic, useTransition, useState } from "react";
import { toggleUpvote } from "@/app/actions/upvote.actions";

export default function UpvoteButton({ 
  startupId, 
  startupName,
  initialCount, 
  initialUpvoted 
}: { 
  startupId: string;
  startupName?: string;
  initialCount: number;
  initialUpvoted: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [upvotedState, setUpvotedState] = useState(initialUpvoted);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  
  const [optimisticState, addOptimisticState] = useOptimistic(
    { count: initialCount, upvoted: upvotedState },
    (state, newUpvoted: boolean) => ({
      count: state.count + (newUpvoted ? 1 : -1),
      upvoted: newUpvoted
    })
  );

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to startup detail page if wrapped in link
    if (isPending) return;
    setError(null);

    const newUpvoted = !optimisticState.upvoted;
    
    startTransition(async () => {
      addOptimisticState(newUpvoted);
      try {
        const result = await toggleUpvote(startupId);
        if (result.success) {
          setUpvotedState(result.upvoted as boolean);
        } else {
          setError(result.error || "Your vote could not be saved. Please try again.");
        }
      } catch {
        setError("Your vote could not be saved. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
    <button
      type="button"
      aria-label={`${optimisticState.upvoted ? "Remove upvote" : "Upvote"}${startupName ? ` for ${startupName}` : ""}, ${optimisticState.count} upvotes`}
      aria-pressed={optimisticState.upvoted}
      aria-busy={isPending}
      aria-describedby={error ? errorId : undefined}
      onClick={handleUpvote}
      disabled={isPending}
      className={`flex flex-col items-center justify-center w-14 h-16 rounded-xl border transition-colors duration-200 disabled:cursor-wait ${
        optimisticState.upvoted 
          ? "border-coral-500 bg-coral-50 text-coral-600" 
          : "border-gray-200 bg-white text-gray-600 hover:border-coral-200 hover:bg-gray-50"
      }`}
    >
      <svg 
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={optimisticState.upvoted ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`w-6 h-6 transition-transform duration-200 ${optimisticState.upvoted ? "scale-110" : ""}`}
      >
        <path d="m18 15-6-6-6 6"/>
      </svg>
      <span className="text-sm font-semibold tabular-nums mt-1">{optimisticState.count.toLocaleString("en-IN")}</span>
    </button>
    {error && <p id={errorId} role="alert" className="max-w-32 text-center text-xs leading-relaxed text-red-600">{error}</p>}
    </div>
  );
}
