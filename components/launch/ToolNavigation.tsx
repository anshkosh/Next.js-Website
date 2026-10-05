"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { FOUNDER_TOOLS } from "@/lib/founder-toolkit";

export default function ToolNavigation({ active }: { active: string }) {
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navigation.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current) return;
    const left = current.getBoundingClientRect().left - nav.getBoundingClientRect().left;
    nav.scrollLeft += left - Math.max(0, (nav.clientWidth - current.clientWidth) / 2);
  }, [active]);
  return <nav ref={navigation} aria-label="Launch tools" className="my-8 flex gap-2 overflow-x-auto border-b border-gray-200 pb-5">
    {FOUNDER_TOOLS.map(({ id, title }) => <Link key={id} href={`/launch-support/${id}`} aria-current={active === id ? "page" : undefined}
      className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500 ${active === id ? "border-coral-200 bg-coral-50 text-coral-800" : "border-gray-200 bg-white text-gray-700 hover:border-coral-300"}`}>{title}</Link>)}
  </nav>;
}
