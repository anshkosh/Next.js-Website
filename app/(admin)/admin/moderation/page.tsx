import { db } from "@/lib/db";
import ModerationCard from "./ModerationCard";
import { ShieldCheck } from "lucide-react";

export default async function ModerationPage() {
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
          {pendingStartups.length} Pending
        </span>
      </div>

      {pendingStartups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">Queue is empty!</h2>
          <p className="text-gray-500">There are no startups pending review right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingStartups.map((startup) => (
            <ModerationCard key={startup.id} startup={startup as any} />
          ))}
        </div>
      )}
    </div>
  );
}
