"use client";

import { useEffect } from "react";
import Link from "next/link";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F1E7]">
      <ErrorState
        status="Something went wrong"
        title="We hit a little snag."
        message="Something went wrong on our end. Try again, or head home. If it keeps happening, please let us know."
        foxComment="Something broke. For once, it wasn’t my doing."
      >
        <button type="button" onClick={() => retry()} className={recoveryLinkClass}>Try again</button>
        <Link href="/" className={secondaryRecoveryLinkClass}>Back to homepage</Link>
        <Link href="/contact" className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-coral-700">Contact us</Link>
      </ErrorState>
    </div>
  );
}
