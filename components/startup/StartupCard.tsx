"use client";

import Link from "next/link";
import Image from "next/image";
import UpvoteButton from "@/components/upvote/UpvoteButton";
import { MessageSquare } from "lucide-react";

type StartupCardProps = {
  startup: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    logoUrl?: string | null;
    upvoteCount: number;
    downvoteCount: number;
    category: {
      name: string;
      iconName?: string | null;
    };
    metadata?: unknown;
    hasUpvoted: boolean;
    hasDownvoted: boolean;
    updateCount?: number;
    activitySignals?: number;
    problemStatement?: string | null;
    latestUpdate?: { title: string; date: string } | null;
  };
};

export default function StartupCard({ startup }: StartupCardProps) {
  const metadata = startup.metadata && typeof startup.metadata === "object" && !Array.isArray(startup.metadata)
    ? startup.metadata as Record<string, unknown> : {};
  const city = typeof metadata.city === "string" ? metadata.city : undefined;
  const foundedYear = typeof metadata.foundedYear === "string" || typeof metadata.foundedYear === "number" ? metadata.foundedYear : undefined;

  // The startup name's link stretches over the whole card; the vote control sits above it.
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-[border-color,box-shadow] duration-(--duration-quick) hover:border-coral-300 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          {startup.logoUrl ? (
            <Image src={startup.logoUrl} alt="" fill className="object-cover" sizes="48px" />
          ) : (
            <div aria-hidden="true" className="flex h-full w-full items-center justify-center bg-gray-100 text-xl font-bold text-gray-500">
              {startup.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-heading text-xl font-bold text-gray-900 transition-colors duration-(--duration-quick) group-hover:text-coral-700">
            <Link href={`/startups/${startup.slug}`} className="after:absolute after:inset-0 after:rounded-xl">{startup.name}</Link>
          </h3>
          <p className="truncate text-xs font-medium text-coral-700">{startup.category.name}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">{startup.tagline}</p>

      {startup.problemStatement && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-800">
          <span className="font-semibold text-gray-900">Problem: </span>{startup.problemStatement}
        </p>
      )}

      {startup.latestUpdate && (
        <p className="mt-4 flex min-w-0 items-start gap-2 text-xs leading-relaxed text-gray-600">
          <MessageSquare aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral-600" />
          <span className="line-clamp-1"><span className="font-semibold text-gray-800">Update · {startup.latestUpdate.date}:</span> {startup.latestUpdate.title}</span>
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {city && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">📍 {city}</span>
          )}
          {foundedYear && (
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-600">Est. {foundedYear}</span>
          )}
          {startup.updateCount != null && startup.updateCount > 1 && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{startup.updateCount} updates</span>
          )}
        </div>
        <div className="relative z-10 shrink-0">
          <UpvoteButton
            startupId={startup.id}
            initialCount={startup.upvoteCount}
            initialUpvoted={startup.hasUpvoted}
            initialDownvotes={startup.downvoteCount}
            initialDownvoted={startup.hasDownvoted}
            startupName={startup.name}
            activitySignals={startup.activitySignals}
          />
        </div>
      </div>
    </article>
  );
}
