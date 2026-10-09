"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Newspaper } from "lucide-react";

type Update = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UpdatesSection({ updates }: { updates: Update[] }) {
  const [showAll, setShowAll] = useState(false);

  const total = updates.length;
  const visibleUpdates = showAll ? updates : updates.slice(0, 3);

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-coral-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-heading">Founder Updates</h2>
            <p className="text-sm text-gray-500">
              {total ? `${total} update${total !== 1 ? "s" : ""} from the team` : "Progress from the team"}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {total === 0 ? (
        <p className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm leading-relaxed text-gray-600">
          No updates yet. The founder hasn’t published a progress update.
        </p>
      ) : <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-100" />

        <div className="space-y-0">
          {visibleUpdates.map((update) => {
            const updateNumber = total - (updates.indexOf(update));

            return (
              <div key={update.id} className="relative pl-12 pb-8 last:pb-0 group">
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-1 w-[18px] h-[18px] rounded-full bg-white border-[3px] border-coral-400 group-hover:border-coral-500 transition-colors z-10" />

                {/* Content card */}
                <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-coral-100 text-coral-700 text-xs font-bold">
                      Update #{updateNumber}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(update.createdAt)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{update.title}</h3>

                  {/* Body */}
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {update.body}
                  </div>

                  {/* Image */}
                  {update.imageUrl && (
                    <div className="mt-4 relative w-full max-w-lg rounded-xl overflow-hidden border border-gray-200">
                      <Image
                        src={update.imageUrl}
                        alt={update.title}
                        width={600}
                        height={400}
                        className="object-cover w-full h-auto"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* Show More */}
      {total > 3 && !showAll && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-coral-600 bg-coral-50 hover:bg-coral-100 rounded-xl transition-colors"
          >
            Show {total - 3} More Update{total - 3 !== 1 ? "s" : ""}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
