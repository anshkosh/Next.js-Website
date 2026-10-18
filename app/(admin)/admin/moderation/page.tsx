import { db } from "@/lib/db";
import ModerationCard from "./ModerationCard";
import { ShieldCheck } from "lucide-react";
import RevisionReviewCard from "@/components/startup/RevisionReviewCard";
import { revisionPatch } from "@/lib/startup-revisions";

export default async function ModerationPage() {
  const revisions = await db.startupRevision.findMany({
    where: { status: "PENDING_REVIEW" },
    include: { startup: { include: { founder: { select: { name: true } } } } },
    orderBy: { updatedAt: "asc" },
  });
  const pendingStartups = await db.startup.findMany({
    where: {
      status: "PENDING_REVIEW",
    },
    include: {
      category: true,
      founder: {
        select: {
          name: true,
          email: true,
        },
      },
      founders: true,
    },
    orderBy: {
      createdAt: "asc", // Oldest first for queue
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="h-8 w-8 text-coral-500" />
        <h1 className="text-3xl font-bold font-heading">Moderation Queue</h1>
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold ml-2">
          {pendingStartups.length + revisions.length} Pending
        </span>
      </div>

      {pendingStartups.length === 0 && revisions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">Queue is empty!</h2>
          <p className="text-gray-500">There are no startups pending review right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingStartups.map((startup) => (
            <ModerationCard key={startup.id} startup={startup} />
          ))}
        </div>
      )}
      {revisions.map(revision => {
        const proposed = revisionPatch(revision.data, revision.startupId);
        const current = revision.startup as unknown as Record<string, unknown>;
        const changes = Object.entries(proposed).flatMap(([key, value]) => {
          if (key === "metadata") {
            const previous = current.metadata as Record<string, unknown> | null;
            return Object.entries(value || {}).filter(([field]) => ["city", "foundedYear", "twitterUrl", "linkedinUrl", "features", "pitchDeckUrl", "pitchDeckVisibility"].includes(field))
              .filter(([field, proposedValue]) => JSON.stringify(previous?.[field]) !== JSON.stringify(proposedValue))
              .map(([field, proposedValue]) => ({ label: field, current: typeof previous?.[field] === "string" ? previous[field] as string : JSON.stringify(previous?.[field]) || "", proposed: typeof proposedValue === "string" ? proposedValue : JSON.stringify(proposedValue) }));
          }
          if (JSON.stringify(current[key]) === JSON.stringify(value)) return [];
          return [{ label: key, current: typeof current[key] === "string" ? current[key] as string : JSON.stringify(current[key]) || "", proposed: typeof value === "string" ? value : JSON.stringify(value) || "" }];
        });
        return <RevisionReviewCard key={revision.id} id={revision.id} version={revision.updatedAt.toISOString()} name={revision.startup.name} owner={revision.startup.founder.name} changes={changes} />;
      })}
    </div>
  );
}
