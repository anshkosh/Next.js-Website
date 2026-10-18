import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSettingValue } from "@/app/actions/settings.actions";
import SubmitReviewButton from "@/components/dashboard/SubmitReviewButton";
import DeleteStartupButton from "@/components/dashboard/DeleteStartupButton";
import FounderWorkspace from "@/components/dashboard/FounderWorkspace";
import DashboardOverview, { type DashboardNotice } from "@/components/dashboard/DashboardOverview";
import {
  Rocket,
  Star,
  Activity,
  Plus,
  Edit2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Zap,
  BookOpen,
  MoreHorizontal,
} from "lucide-react";

const statusConfig = {
  LIVE: {
    label: "Live",
    badgeCls: "bg-green-100 text-green-700",
    borderCls: "border-t-green-500",
    glowCls: "shadow-green-100",
  },
  DRAFT: {
    label: "Draft",
    badgeCls: "bg-gray-100 text-gray-600",
    borderCls: "border-t-gray-400",
    glowCls: "",
  },
  PENDING_REVIEW: {
    label: "Under Review",
    badgeCls: "bg-yellow-100 text-yellow-700",
    borderCls: "border-t-yellow-400",
    glowCls: "",
  },
  REJECTED: {
    label: "Rejected",
    badgeCls: "bg-red-100 text-red-700",
    borderCls: "border-t-red-500",
    glowCls: "",
  },
  SUSPENDED: {
    label: "Suspended",
    badgeCls: "bg-orange-100 text-orange-800",
    borderCls: "border-t-orange-400",
    glowCls: "",
  },
} as const;

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const startups = await db.startup.findMany({
    where: { founderId: session.user.id },
    include: {
      category: true,
      revision: { select: { status: true, notes: true } },
      _count: {
        select: {
          comments: { where: { status: "APPROVED" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalStartups = startups.length;
  const maxStartupsSetting = await getSettingValue(
    "max_startups_per_user",
    "1",
  );
  const maxStartups = Math.max(1, parseInt(maxStartupsSetting, 10) || 1);
  const isAtLimit = totalStartups >= maxStartups;

  const totalSignals = startups.reduce((sum, s) => sum + s.signalCount, 0);
  const liveStartups = startups.filter((s) => s.status === "LIVE").length;

  const journalReviews = await db.founderJournalRevision.findMany({
    where: { entry: { authorId: session.user.id, visibility: "PUBLIC" }, status: { in: ["PENDING_REVIEW", "CHANGES_REQUESTED", "SCHEDULED"] } },
    select: { id: true, status: true, scheduledAt: true, reviewerNotes: true },
    orderBy: { updatedAt: "desc" }, take: 5,
  });
  const notices: DashboardNotice[] = startups.flatMap(startup => {
    if (startup.revision?.status === "REJECTED" || startup.status === "REJECTED") return [{ id: startup.id, title: `${startup.name}: changes need attention`, detail: startup.revision?.notes || startup.adminNotes || "Review the feedback and resubmit your startup.", href: `/startup/${startup.id}/edit` }];
    if (startup.status === "PENDING_REVIEW" || startup.revision?.status === "PENDING_REVIEW") return [{ id: startup.id, title: `${startup.name}: under review`, detail: "Your submission is awaiting a review.", href: `/startup/${startup.id}/edit` }];
    if (startup.status === "SUSPENDED") return [{ id: startup.id, title: `${startup.name}: listing suspended`, detail: "Contact us for help with your listing.", href: "/contact" }];
    return [];
  });
  for (const review of journalReviews) {
    const scheduled = review.status === "SCHEDULED";
    notices.push({ id: review.id, title: scheduled ? "Journal entry scheduled" : review.status === "CHANGES_REQUESTED" ? "Journal feedback is ready" : "Journal entry awaiting review", detail: scheduled && review.scheduledAt ? `Scheduled for ${review.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST.` : review.reviewerNotes || "Open your journal to check the submission.", href: "/dashboard/journal", scheduled });
  }
  const draftStartup = startups.find(startup => startup.status === "DRAFT");
  const liveStartup = startups.find(startup => startup.status === "LIVE");
  const incomplete = liveStartup && (!liveStartup.logoUrl || !liveStartup.problemStatement || !liveStartup.solutionStatement);
  const liveStartupIds = startups.filter(startup => startup.status === "LIVE").map(startup => startup.id);
  const activitySince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const journalDueSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [latestJournal, recentMilestone, latestUpdate, recentFounderReply, communityStartup] = await Promise.all([
    db.founderJournalEntry.findFirst({ where: { authorId: session.user.id }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    db.founderJournalEntry.findFirst({ where: { authorId: session.user.id, milestoneDone: true, updatedAt: { gte: activitySince } }, select: { id: true } }),
    liveStartupIds.length ? db.startupUpdate.findFirst({ where: { startupId: { in: liveStartupIds }, createdAt: { gte: activitySince } }, select: { id: true } }) : null,
    liveStartupIds.length ? db.comment.findFirst({ where: { startupId: { in: liveStartupIds }, repliedAt: { gte: activitySince } }, select: { id: true } }) : null,
    db.startup.findFirst({
      where: { status: "LIVE", founderId: { not: session.user.id }, ...(session.user.email ? { comments: { none: { authorEmail: { equals: session.user.email, mode: "insensitive" }, status: { in: ["PENDING", "APPROVED"] } } } } : {}) },
      select: { slug: true, name: true }, orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    }),
  ]);
  const needsJournal = !latestJournal || latestJournal.updatedAt < journalDueSince;
  const nextStep = draftStartup ? { title: `Finish ${draftStartup.name}`, detail: "Complete your draft and send it for review.", href: `/startup/${draftStartup.id}/edit`, label: "Continue draft" }
    : incomplete ? { title: "Help people understand your startup", detail: "Add your logo, the problem you solve, and your solution to your profile.", href: `/startup/${liveStartup.id}/edit`, label: "Complete profile" }
    : needsJournal ? { title: "Capture a lesson from your journey", detail: "What worked, what surprised you, and what will you try next? Keep it private or submit a journal story to share.", href: "/dashboard/journal", label: "Write in your journal" }
    : liveStartup && !latestUpdate ? { title: liveStartup.updateCount === 0 ? "Share your first startup update" : "Share what you’re working on", detail: "Tell people about a product improvement, a customer insight, or what you plan to try next.", href: `/startup/${liveStartup.id}/updates`, label: "Write an update" }
    : !recentMilestone ? { title: "Recognise a milestone", detail: "Mark a small win in your journal, note what it means, and choose whether to share it publicly.", href: "/dashboard/journal", label: "Record a milestone" }
    : liveStartup && !recentFounderReply ? { title: "Continue a conversation", detail: "Reply to a question or piece of feedback on your startup. A thoughtful response helps your community take part.", href: `/startup/${liveStartup.id}/discussion`, label: "Join your discussion" }
    : communityStartup ? { title: `Join ${communityStartup.name}’s discussion`, detail: "Offer one specific observation or ask a thoughtful question that helps this founder test an assumption.", href: `/startups/${communityStartup.slug}#section-questions`, label: "Share feedback" }
    : liveStartup ? { title: "Keep building in public", detail: "Add a journal reflection, share a recent update, or celebrate a new milestone when you have something meaningful to share.", href: "/dashboard/journal", label: "Open your journal" }
    : { title: "Explore another founder’s journey", detail: "Browse startups and share a useful question or piece of feedback with a founder.", href: "/discover", label: "Explore startups" };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #fafafa 0%, #f0f4ff 40%, #fff5f2 100%)",
      }}
    >
      <div className="container mx-auto px-4 pt-7 pb-28 md:pt-10 max-w-6xl">
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 tracking-tight">
            Welcome back,{" "}
            <span className="text-coral-500">
              {session.user.name?.split(" ")[0] || "Founder"}
            </span>
            ! 👋
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            Your startup, your progress, your next move.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {/* Total Startups */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <Rocket size={26} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                Total Startups
              </p>
              <p className="text-3xl font-bold text-gray-900 leading-none">
                {totalStartups}
                <span className="text-base font-normal text-gray-400 ml-1">
                  / {maxStartups}
                </span>
              </p>
            </div>
          </div>

          {/* Total Signals */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-coral-50 flex items-center justify-center shrink-0">
              <Star size={26} className="text-coral-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                Total Net Votes
              </p>
              <p className="text-3xl font-bold text-gray-900 leading-none">
                {totalSignals}
              </p>
            </div>
          </div>

          {/* Live Startups */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
              <Activity size={26} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                Live Startups
              </p>
              <p className="text-3xl font-bold text-gray-900 leading-none">
                {liveStartups}
              </p>
            </div>
          </div>
        </div>

        <DashboardOverview notices={notices} nextStep={nextStep} />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Startups</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {totalStartups} of {maxStartups} startup slot
              {maxStartups !== 1 ? "s" : ""} used
            </p>
          </div>

          {!isAtLimit && <Link href="/startup/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-600"><Plus size={16} /> Submit a New Startup</Link>}

        </div>

        {/* Startup Cards */}
        {startups.length === 0 ? (
          <div className="bg-white py-24 px-4 text-center rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 bg-coral-50 rounded-full flex items-center justify-center mb-6">
              <Rocket className="text-coral-400 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No startups yet
            </h2>
            <p className="text-gray-400 mb-8 max-w-md text-sm">
              You haven’t submitted any startups. Add your first startup to get
              discovered by thousands of makers and investors.
            </p>
            <Link
              href="/startup/new"
              className="px-6 py-3 bg-coral-500 text-white rounded-xl font-semibold hover:bg-coral-600 transition-colors shadow-sm"
            >
              Submit your first startup
            </Link>
            <div className="mt-5 w-full max-w-md"><FounderWorkspace /></div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-5 ${startups.length > 1 ? "md:grid-cols-2" : ""}`}>
            {startups.map((startup) => {
              const cfg =
                statusConfig[startup.status as keyof typeof statusConfig] ??
                statusConfig.DRAFT;

              return (
                <div
                  key={startup.id}
                  className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${cfg.borderCls} shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden relative group`}
                >
                  {/* Delete button */}
                  <details className="absolute top-3 right-3 z-10">
                    <summary aria-label={`More actions for ${startup.name}`} className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-coral-500 [&::-webkit-details-marker]:hidden"><MoreHorizontal size={20} aria-hidden="true" /></summary>
                    <div className="absolute right-0 flex items-center gap-3 whitespace-nowrap rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg">Delete startup<DeleteStartupButton
                      startupId={startup.id}
                      startupName={startup.name}
                    /></div>
                  </details>

                  {/* Card Body */}
                  <div className="p-5 flex items-start gap-4">
                    {/* Logo */}
                    <div className="w-16 h-16 shrink-0 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                      {startup.logoUrl ? (
                        <Image
                          src={startup.logoUrl}
                          alt={startup.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-gray-300">
                          {startup.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {startup.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full ${cfg.badgeCls}`}
                        >
                          {cfg.label}
                        </span>
                        {startup.revision && <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{startup.revision.status === "REJECTED" ? "Changes need attention" : "Changes awaiting review"}</span>}
                      </div>
                      <p className="text-sm text-gray-400 truncate mb-3">
                        {startup.tagline}
                      </p>

                      {/* Meta pills */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                          <Star size={11} className="text-coral-400" />
                          {startup.signalCount} net votes
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                          {startup.category.name}
                        </span>
                        {startup._count.comments > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                            <MessageSquare size={11} />
                            {startup._count.comments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 mx-5" />

                  {/* Card Footer — Status-aware actions */}
                  <div className="p-4">
                    <div className="mb-3"><FounderWorkspace showJournal={startup.status !== "LIVE"} /><p className="mt-2 text-center text-xs leading-relaxed text-gray-500">Free tools to validate your idea, plan your runway, and prepare your launch.</p></div>
                    {/* LIVE */}
                    {startup.status === "LIVE" && (
                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-green-600 flex items-center gap-1.5 mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                          Your startup is live!
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/startups/${startup.slug}`}
                            target="_blank"
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                          >
                            <ExternalLink size={13} /> View Page
                          </Link>
                          <Link
                            href={`/startup/${startup.id}/edit`}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 size={13} /> Edit
                          </Link>
                          <div className="col-span-2 grid grid-cols-3 gap-2">
                          <Link
                            href={`/startup/${startup.id}/updates`}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-coral-50 border border-coral-200 text-coral-700 rounded-xl text-xs font-semibold hover:bg-coral-100 transition-colors relative"
                          >
                            <Zap size={13} /> Updates
                            {startup.updateCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 bg-coral-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {startup.updateCount}
                              </span>
                            )}
                          </Link>
                          <Link href="/dashboard/journal" className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">
                            <BookOpen aria-hidden="true" size={13} /> Journal
                          </Link>
                          <Link
                            href={`/startup/${startup.id}/discussion`}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors relative"
                          >
                            <MessageSquare size={13} /> Discussion
                            {startup._count.comments > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {startup._count.comments}
                              </span>
                            )}
                          </Link>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-500">Updates for announcements. Journal for reflections and stories. Discussion for conversations.</p>
                      </div>
                    )}

                    {/* DRAFT */}
                    {startup.status === "DRAFT" && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-400 mb-1">
                          Continue editing your draft
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/startup/${startup.id}/edit`}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 size={13} /> Edit
                          </Link>
                          <SubmitReviewButton startupId={startup.id} />
                        </div>
                      </div>
                    )}

                    {/* PENDING_REVIEW */}
                    {startup.status === "PENDING_REVIEW" && (
                      <div className="space-y-2">
                        <div className="bg-yellow-50 text-yellow-800 px-3 py-2.5 rounded-xl text-xs font-medium flex gap-2 items-start">
                          <AlertCircle
                            size={13}
                            className="shrink-0 mt-0.5 text-yellow-500"
                          />
                          Under review — we’ll email you when it’s approved.
                        </div>
                        {startup._count.comments > 0 && (
                          <Link
                            href={`/startup/${startup.id}/discussion`}
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors"
                          >
                            <MessageSquare size={13} /> Discussion (
                            {startup._count.comments})
                          </Link>
                        )}
                      </div>
                    )}

                    {/* REJECTED */}
                    {startup.status === "REJECTED" && (
                      <div className="space-y-2">
                        <div className="bg-red-50 text-red-700 px-3 py-2 rounded-xl text-xs font-medium border border-red-100">
                          <p className="font-bold mb-0.5">Changes needed</p>
                          <p className="line-clamp-2 text-red-600 font-normal">
                            {startup.adminNotes}
                          </p>
                        </div>
                        <Link
                          href={`/startup/${startup.id}/edit`}
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                        >
                          <RefreshCw size={13} /> Edit & Resubmit
                        </Link>
                      </div>
                    )}

                    {/* SUSPENDED */}
                    {startup.status === "SUSPENDED" && (
                      <div className="bg-orange-50 text-orange-800 px-3 py-2.5 rounded-xl text-xs font-medium flex gap-2 items-start border border-orange-100">
                        <AlertCircle
                          size={13}
                          className="shrink-0 mt-0.5 text-orange-500"
                        />
                        Account suspended. Please contact support.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-8 border-t border-gray-200 pt-5 text-sm text-gray-600">Need a hand? <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-coral-700 underline underline-offset-4">Contact us</Link></p>
      </div>
    </div>
  );
}
