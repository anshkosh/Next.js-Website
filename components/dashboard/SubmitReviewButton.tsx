"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitForReview } from "@/app/actions/startup.actions";

export default function SubmitReviewButton({
  startupId,
}: {
  startupId: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitForReview(startupId);
      if (res.error) {
        alert(res.error);
        // If incomplete, direct founder to the edit page to complete missing fields
        if (
          res.error.toLowerCase().includes("description") ||
          res.error.toLowerCase().includes("website") ||
          res.error.toLowerCase().includes("valid")
        ) {
          router.push(`/startup/${startupId}/edit`);
        }
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Submit for review error:", err);
      alert("Failed to submit for review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={isSubmitting}
      className="w-full flex justify-center items-center gap-1 py-2.5 bg-coral-500 text-white rounded-lg text-sm font-semibold hover:bg-coral-600 transition-colors disabled:opacity-50"
    >
      {isSubmitting ? "Submitting..." : "Submit"}
    </button>
  );
}
