import Link from "next/link";
import type { ReactNode } from "react";
import ToolNavigation from "./ToolNavigation";
import ToolWorkspace from "./ToolWorkspace";

export const launchLinkStyle = "rounded-md text-sm font-semibold text-coral-700 underline underline-offset-4 hover:text-coral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-500";

export default function LaunchToolLayout({ title, description, active, children }: {
  title: string; description: string; active: string; children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 text-gray-900 sm:px-6 md:py-16">
      <Link href="/launch-support#tools-heading" className={launchLinkStyle}>← All free founder tools</Link>
      <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-coral-700">Founder workspace · Free</p>
      <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">{description}</p>
      <ToolNavigation active={active} />
      <ToolWorkspace>{children}</ToolWorkspace>
    </div>
  );
}
