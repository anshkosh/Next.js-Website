"use client";

import { useEffect } from "react";
import ErrorMascot from "@/components/site/ErrorMascot";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF8F5] antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <ErrorMascot />
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Something went badly wrong</h1>
          <p className="mb-8 max-w-md text-gray-600">
            The whole page tripped over itself. Give the fox a poke, then try again.
          </p>
          <div className="flex gap-3">
            <button onClick={() => reset()} className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800">
              Try again
            </button>
            {/* A plain anchor on purpose: the root layout is gone, so a full reload is the safe route home. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-lg border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50">
              Return home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
