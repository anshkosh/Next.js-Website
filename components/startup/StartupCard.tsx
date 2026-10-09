"use client";

import Link from "next/link";
import Image from "next/image";
import UpvoteButton from "@/components/upvote/UpvoteButton";
import { Rocket, MessageSquare } from "lucide-react";

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
  };
};

export default function StartupCard({ startup }: StartupCardProps) {
  const metadata = startup.metadata && typeof startup.metadata === "object" && !Array.isArray(startup.metadata)
    ? startup.metadata as Record<string, unknown> : {};
  const city = typeof metadata.city === "string" ? metadata.city : undefined;
  const foundedYear = typeof metadata.foundedYear === "string" || typeof metadata.foundedYear === "number" ? metadata.foundedYear : undefined;

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full group relative">
      {/* Top Border */}
      <div className="h-1.5 w-full bg-coral-500 rounded-t-xl absolute top-0 left-0 right-0" />

      <div className="p-6 pt-8 flex-1 flex flex-col">
        {/* Header: Logo and Category */}
        <div className="flex justify-between items-start mb-5">
          <div className="w-16 h-16 relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0 shadow-sm">
            {startup.logoUrl ? (
              <Image
                src={startup.logoUrl}
                alt={`${startup.name} logo`}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-100 text-gray-400 font-bold">
                {startup.name.charAt(0)}
              </div>
            )}
          </div>
          <span className="text-xs font-medium text-gray-500 truncate max-w-[140px] text-right">
            {startup.category.name}
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5 mb-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-coral-500 transition-colors truncate">
            <Link href={`/startups/${startup.slug}`}>{startup.name}</Link>
          </h3>
        </div>

        {/* Tagline */}
        <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed flex-1">
          {startup.tagline}
        </p>

        {/* Badges / Location */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {city && (
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              📍 {city}
            </span>
          )}
          {foundedYear && (
            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
              Est. {foundedYear}
            </span>
          )}
          {startup.updateCount != null && startup.updateCount > 0 && (
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> {startup.updateCount} Update{startup.updateCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 pb-6 flex gap-3">
        <Link
          href={`/startups/${startup.slug}`}
          className="flex-1 flex justify-center items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg font-medium transition-colors text-sm"
        >
          View {startup.name} <Rocket className="w-4 h-4 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-orange-400" />
        </Link>
        <div className="shrink-0 flex items-stretch">
          <UpvoteButton
            startupId={startup.id}
            initialCount={startup.upvoteCount}
            initialUpvoted={startup.hasUpvoted}
            initialDownvotes={startup.downvoteCount}
            initialDownvoted={startup.hasDownvoted}
            startupName={startup.name}
          />
        </div>
      </div>
    </div>
  );
}
