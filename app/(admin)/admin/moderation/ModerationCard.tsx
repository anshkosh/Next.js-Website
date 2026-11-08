import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { safeLaunchUrl } from "@/lib/launch-resources";
import StartupReviewActions from "./StartupReviewActions";

type ModerationStartup = Prisma.StartupGetPayload<{ include: { category: true; founder: { select: { name: true; email: true } } } }>;

export default function ModerationCard({ startup }: { startup: ModerationStartup }) {
  const logo = safeLaunchUrl(startup.logoUrl);
  const wallImage = safeLaunchUrl(startup.wallImageUrl) || logo;
  const website = safeLaunchUrl(startup.websiteUrl);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {startup.wallOptIn && <section className="mb-4 rounded-lg border p-3"><h3 className="font-semibold">Startup Wall opt-in</h3><p className="text-sm text-gray-600">Approving this profile also approves this Wall image.</p>{wallImage && <Image unoptimized referrerPolicy="no-referrer" src={wallImage} alt="Proposed Wall image" width={320} height={320} className="mt-2 max-h-48 object-contain" />}</section>}
        <div className="flex gap-4 items-start">
          {logo ? (
            <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 flex overflow-hidden border border-gray-200">
              <Image
                src={logo}
                unoptimized
                referrerPolicy="no-referrer"
                alt={startup.name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-500 border border-gray-200">
              {startup.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold truncate">{startup.name}</h3>
                <p className="text-gray-600 truncate">{startup.tagline}</p>
              </div>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                {startup.category.name}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Founder</span>
                <span className="font-medium">{startup.founder?.name}</span>
                <span className="text-gray-500 block text-xs">
                  {startup.founder?.email}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Details</span>
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-coral-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    Website <ExternalLink size={14} />
                  </a>
                )}
                <span className="text-gray-500 block text-xs mt-1">
                  Submitted {new Date(startup.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-gray-500 block text-sm mb-1">
                Description
              </span>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-100 leading-relaxed">
                {startup.description.length > 200
                  ? startup.description.substring(0, 200) + "..."
                  : startup.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
        <Link
          href={`/admin/moderation/${startup.id}`}
          prefetch={false}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 font-medium text-gray-700 hover:bg-gray-100"
        >
          <Eye size={18} aria-hidden="true" /> Review full submission
        </Link>
        <StartupReviewActions id={startup.id} name={startup.name} />
      </div>
    </div>
  );
}
