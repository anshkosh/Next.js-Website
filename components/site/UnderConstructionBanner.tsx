"use client";

import { usePathname } from "next/navigation";

export function UnderConstructionBanner() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <aside
      aria-label="Site status"
      data-print-hide="true"
      className="border-b border-amber-300/80 bg-amber-50 px-4 py-2.5 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-sm leading-6">
        <span aria-hidden="true" className="text-base">🚧</span>
        <p>
          <strong className="font-semibold">Anshkosh is under construction.</strong>{" "}
          We’re building the best way to discover India’s next startups.
        </p>
      </div>
    </aside>
  );
}
