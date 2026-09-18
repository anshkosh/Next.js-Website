"use client";

import { useOptimistic, useTransition, useState } from "react";
import { toggleUpvote } from "@/app/actions/upvote.actions";

export default function UpvoteButton({ 
  startupId, 
  initialCount, 
  initialUpvoted 
}: { 
  startupId: string;
  initialCount: number;
  initialUpvoted: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [upvotedState, setUpvotedState] = useState(initialUpvoted);
  
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

    const newUpvoted = !optimisticState.upvoted;
    
    startTransition(async () => {
      addOptimisticState(newUpvoted);
      const result = await toggleUpvote(startupId);
      
      if (result.success) {
        setUpvotedState(result.upvoted as boolean);
      } else {
        // Handle error visually if needed
        console.error(result.error);
      }
    });
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={isPending}
      className={`flex flex-col items-center justify-center w-14 h-16 rounded-md border transition-all duration-200 ${
        optimisticState.upvoted 
          ? "border-coral-500 bg-coral-50 text-coral-600" 
          : "border-gray-200 bg-white text-gray-600 hover:border-coral-200 hover:bg-gray-50"
      }`}
    >
      <svg 
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
      <span className="text-sm font-semibold mt-1">{optimisticState.count}</span>
    </button>
  );
}
