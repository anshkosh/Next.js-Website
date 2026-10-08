import type { ReactNode } from "react";
import ErrorMascot from "./ErrorMascot";

export const recoveryLinkClass = "inline-flex min-h-12 items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-600";
export const secondaryRecoveryLinkClass = "inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-600";

export default function ErrorState({
  status,
  title,
  message,
  foxComment,
  children,
  compact = false,
  headingLevel = 1,
}: {
  status: string;
  title: string;
  message: string;
  foxComment: string;
  children: ReactNode;
  compact?: boolean;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section className={`w-full px-4 text-center ${compact ? "mx-auto max-w-3xl py-12" : "flex min-h-[70vh] items-center justify-center bg-[#F7F1E7] py-16 sm:py-20"}`}>
      <div className="mx-auto w-full max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-coral-700">{status}</p>
        <Heading className={`font-heading font-bold tracking-tight text-gray-900 ${compact ? "text-3xl" : "text-4xl sm:text-5xl"}`}>
          {title}
        </Heading>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600">{message}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{children}</div>
        <div className="mx-auto mt-8 flex max-w-lg flex-col items-center justify-center sm:flex-row sm:gap-4">
          <ErrorMascot size={compact ? 176 : 240} />
          <div className="max-w-56 sm:text-left">
            <p className="text-sm font-semibold text-gray-900">Kosh · Our resident trail finder</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">“{foxComment}”</p>
            <p className="mt-3 text-xs text-gray-600">Tap Kosh for a little cheer.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
