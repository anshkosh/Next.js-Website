import Link from "next/link";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import { PUBLIC_UPDATES_PAGE_SIZE, updatesPageHref } from "@/lib/public-updates";

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

export default function UpdatesSection({ updates, totalCount, page, slug, journalPage }: {
  updates: Update[]; totalCount: number; page: number; slug: string; journalPage: number;
}) {
  const total = totalCount;
  const offset = (page - 1) * PUBLIC_UPDATES_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / PUBLIC_UPDATES_PAGE_SIZE));

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
          {updates.map((update, index) => {
            const updateNumber = total - offset - index;

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
                    <span className="text-xs text-gray-500">{formatDate(update.createdAt)}</span>
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

      {totalPages > 1 && (
        <nav aria-label="Founder update pages" className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
          {page > 1 && <Link prefetch={false} href={updatesPageHref(slug, page - 1, journalPage)} className="inline-flex min-h-11 items-center rounded-xl bg-coral-50 px-4 font-semibold text-coral-700 hover:bg-coral-100">Newer updates</Link>}
          <span className="text-gray-600">Page {page} of {totalPages}</span>
          {page < totalPages && <Link prefetch={false} href={updatesPageHref(slug, page + 1, journalPage)} className="inline-flex min-h-11 items-center rounded-xl bg-coral-50 px-4 font-semibold text-coral-700 hover:bg-coral-100">Older updates</Link>}
        </nav>
      )}
    </div>
  );
}
