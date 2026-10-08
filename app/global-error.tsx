"use client";

import { useEffect } from "react";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";
import "./globals.css";

export default function GlobalError({
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
    <html lang="en">
      <body className="min-h-screen bg-[#F7F1E7] antialiased">
        <main id="main-content" className="flex min-h-screen items-center justify-center">
          <ErrorState
            status="Something went wrong"
            title="Even Kosh needs a do-over."
            message="Something went wrong on our end. Try loading the page again, or return to the homepage."
            foxComment="If anyone asks, I was nowhere near the cables."
          >
            <button type="button" onClick={() => retry()} className={recoveryLinkClass}>Try again</button>
            {/* A plain anchor on purpose: the root layout is gone, so a full reload is the safe route home. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={secondaryRecoveryLinkClass}>
              Back to homepage
            </a>
          </ErrorState>
        </main>
      </body>
    </html>
  );
}
