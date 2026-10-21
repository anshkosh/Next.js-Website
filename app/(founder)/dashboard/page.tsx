import DashboardModeControl from "@/components/account/DashboardModeControl";

export const metadata = { title: "Dashboard — Anshkosh", robots: { index: false, follow: false } };
import { publicStartupWhere } from "@/lib/startup-visibility";
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
import { getActivitySignals } from "@/lib/leaderboard";
import {
  Plus,
  Edit2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Zap,
  BookOpen,
  UsersRound,
} from "lucide-react";

const statusConfig = {
  LIVE: {
    label: "Live",
    badgeCls: "bg-green-100 text-green-700",
  },
  DRAFT: {
    label: "Draft",
    badgeCls: "bg-gray-100 text-gray-600",
  },
  PENDING_REVIEW: {
    label: "Under review",
    badgeCls: "bg-yellow-100 text-yellow-700",
  },
  REJECTED: {
    label: "Rejected",
    badgeCls: "bg-red-100 text-red-700",
  },
  SUSPENDED: {
    label: "Suspended",
    badgeCls: "bg-orange-100 text-orange-800",
  },
} as const;

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const profile = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, founderMode: true } });
  if (!profile?.founderMode) return <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:py-16"><DashboardModeControl enabled={false} /><h1 className="font-heading text-3xl font-bold text-gray-900">Welcome, {profile?.name || session.user.name}</h1><p className="mt-3 max-w-xl text-base leading-relaxed text-gray-600">Discover what people are building, ask useful questions and follow their progress. You don’t need a startup to take part.</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/discover" className="inline-flex min-h-12 items-center rounded-xl bg-coral-600 px-5 font-semibold text-white hover:bg-coral-700">Explore startups</Link><Link href="/journal" className="inline-flex min-h-12 items-center rounded-xl border border-gray-300 bg-white px-5 font-semibold text-gray-800 hover:bg-gray-50">Read founder stories</Link></div><section className="mt-12 border-t border-gray-200 pt-6"><h2 className="text-lg font-semibold text-gray-900">Make yourself at home</h2><p className="mt-2 text-sm leading-relaxed text-gray-600">Your member or backer account can share feedback and apply to beta programs where available. Any saved startups and linked journal stories stay hidden publicly while founder mode is off. Building a startup? Turn founder mode on above.</p><Link href="/settings" className="mt-3 inline-flex min-h-11 items-center font-semibold text-coral-700 underline underline-offset-4">Profile settings</Link></section></div>;

  const startups = await db.startup.findMany({
    where: { founderId: session.user.id },
    include: {
      category: true,
      revision: { select: { status: true, notes: true } },
      betaTesterProgram: { select: { enabled: true } },
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

  const liveStartups = startups.filter((s) => s.status === "LIVE").length;
  // Same signal total as the public cards and leaderboard: net votes plus capped activity.
  const activityById = await getActivitySignals(startups.map(startup => startup.id));
  const totalVotes = startups.reduce((sum, s) => sum + s.signalCount, 0);
  const totalActivity = [...activityById.values()].reduce((sum, points) => sum + points, 0);
  const totalSignals = totalVotes + totalActivity;
  // The profile, not the session, so a rename in settings shows straight away.
  const firstName = (profile.name || session.user.name || "").split(" ")[0] || "Founder";

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
  // Request-time server snapshot: auth/headers make this page dynamic.
  const requestTime = new Date();
  const activitySince = new Date(requestTime.getTime() - 30 * 24 * 60 * 60 * 1000);
  const journalDueSince = new Date(requestTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [latestJournal, recentMilestone, latestUpdate, recentFounderReply, communityStartup] = await Promise.all([
    db.founderJournalEntry.findFirst({ where: { authorId: session.user.id }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" } }),
    db.founderJournalEntry.findFirst({ where: { authorId: session.user.id, milestoneDone: true, updatedAt: { gte: activitySince } }, select: { id: true } }),
    liveStartupIds.length ? db.startupUpdate.findFirst({ where: { startupId: { in: liveStartupIds }, createdAt: { gte: activitySince } }, select: { id: true } }) : null,
    liveStartupIds.length ? db.comment.findFirst({ where: { startupId: { in: liveStartupIds }, repliedAt: { gte: activitySince } }, select: { id: true } }) : null,
    db.startup.findFirst({
      where: { ...publicStartupWhere, founderId: { not: session.user.id }, ...(session.user.email ? { comments: { none: { authorEmail: { equals: session.user.email, mode: "insensitive" }, status: { in: ["PENDING", "APPROVED"] } } } } : {}) },
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

  const actionClass = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-coral-300 hover:text-coral-700";
  const countClass = "rounded-full bg-gray-100 px-1.5 text-xs font-semibold tabular-nums text-gray-700";
  const needsReviewNote = startups.some(startup => startup.status !== "LIVE" || startup.revision);

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-7 pb-28 md:pt-10">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Welcome back, <span className="text-coral-700">{firstName}</span>
        </h1>
        <p className="mt-2 text-base text-gray-600">Your startup, your progress, your next move.</p>
      </div>

      <dl className="mb-8 grid grid-cols-3 divide-x divide-gray-100 rounded-2xl border border-gray-200 bg-white">
        <div className="px-4 py-4 sm:px-6">
          <dt className="text-xs font-semibold uppercase tracking-wider text-gray-600">Startups</dt>
          <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-gray-900 sm:text-3xl">
            {totalStartups}<span className="ml-1 font-sans text-sm font-normal text-gray-600">/ {maxStartups}</span>
          </dd>
        </div>
        <div className="px-4 py-4 sm:px-6">
          <dt className="text-xs font-semibold uppercase tracking-wider text-gray-600">Signals</dt>
          <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-gray-900 sm:text-3xl">{totalSignals}</dd>
          <dd className="mt-0.5 text-xs text-gray-600 tabular-nums">{totalVotes} votes + {totalActivity} activity</dd>
        </div>
        <div className="px-4 py-4 sm:px-6">
          <dt className="text-xs font-semibold uppercase tracking-wider text-gray-600">Live</dt>
          <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-gray-900 sm:text-3xl">{liveStartups}</dd>
        </div>
      </dl>

      <DashboardOverview notices={notices} nextStep={nextStep} />

      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">Your startups</h2>
          <p className="mt-0.5 text-sm text-gray-600">
            {totalStartups} of {maxStartups} startup slot{maxStartups !== 1 ? "s" : ""} used
          </p>
        </div>
        {!isAtLimit && <Link href="/startup/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-coral-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-700"><Plus size={16} aria-hidden="true" /> Submit a new startup</Link>}
      </div>

      {needsReviewNote && <p className="mb-6 text-sm text-gray-600">Submissions are reviewed manually. We’ll email you when a decision is ready; contact us if you need a status update.</p>}

      {startups.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-4 py-20 text-center">
          <h2 className="mb-2 font-heading text-2xl font-bold text-gray-900">No startups yet</h2>
          <p className="mb-8 max-w-md text-sm text-gray-600">
            You haven’t submitted any startups. Add your first startup to get discovered by people interested in what you’re building.
          </p>
          <Link href="/startup/new" className="inline-flex min-h-11 items-center rounded-xl bg-coral-600 px-6 font-semibold text-white transition-colors hover:bg-coral-700">
            Submit your first startup
          </Link>
          <div className="mt-5 w-full max-w-md"><FounderWorkspace /></div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-5 ${startups.length > 1 ? "md:grid-cols-2" : ""}`}>
          {startups.map((startup) => {
            const cfg = statusConfig[startup.status as keyof typeof statusConfig] ?? statusConfig.DRAFT;
            const activity = activityById.get(startup.id);

            return (
              <article key={startup.id} aria-labelledby={`startup-${startup.id}`} className="flex flex-col rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    {startup.logoUrl ? (
                      <Image src={startup.logoUrl} alt="" width={64} height={64} className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden="true" className="text-2xl font-bold text-gray-500">{startup.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 id={`startup-${startup.id}`} className="truncate text-base font-bold text-gray-900">{startup.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badgeCls}`}>{cfg.label}</span>
                      {startup.revision && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">{startup.revision.status === "REJECTED" ? "Changes need attention" : "Changes awaiting review"}</span>}
                      {startup.betaTesterProgram?.enabled && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">Beta signups open</span>}
                    </div>
                    <p className="mb-3 truncate text-sm text-gray-600">{startup.tagline}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 tabular-nums">
                      <span className="font-semibold text-gray-800">
                        {activity === undefined ? `${startup.signalCount} net votes` : `${startup.signalCount + activity} signals · ${startup.signalCount} votes + ${activity} activity`}
                      </span>
                      <span>{startup.category.name}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-4">
                  {startup.status === "LIVE" && (
                    <div className="space-y-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                        <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-green-600" />
                        Your startup is live
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/startups/${startup.slug}`} target="_blank" rel="noopener" className={actionClass}>
                          <ExternalLink size={14} aria-hidden="true" /> View page<span className="sr-only"> (opens in a new tab)</span>
                        </Link>
                        <Link href={`/startup/${startup.id}/edit`} className={actionClass}>
                          <Edit2 size={14} aria-hidden="true" /> Edit
                        </Link>
                      </div>
                      <nav aria-label={`Manage ${startup.name}`} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Link href={`/startup/${startup.id}/updates`} className={actionClass}>
                          <Zap size={14} aria-hidden="true" /> Updates
                          {startup.updateCount > 0 && <span className={countClass}>{startup.updateCount}<span className="sr-only"> updates</span></span>}
                        </Link>
                        <Link href="/dashboard/journal" className={actionClass}>
                          <BookOpen size={14} aria-hidden="true" /> Journal
                        </Link>
                        <Link href={`/startup/${startup.id}/discussion`} className={actionClass}>
                          <MessageSquare size={14} aria-hidden="true" /> Discussion
                          {startup._count.comments > 0 && <span className={countClass}>{startup._count.comments}<span className="sr-only"> comments</span></span>}
                        </Link>
                        <Link href={`/startup/${startup.id}/beta-testers`} className={actionClass}>
                          <UsersRound size={14} aria-hidden="true" /> Beta testers
                        </Link>
                      </nav>
                      <p className="text-xs leading-relaxed text-gray-600">Updates for announcements. Journal for reflections and stories. Discussion for conversations.</p>
                    </div>
                  )}

                  {startup.status === "DRAFT" && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Continue editing your draft.</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/startup/${startup.id}/edit`} className={actionClass}>
                          <Edit2 size={14} aria-hidden="true" /> Edit
                        </Link>
                        <SubmitReviewButton startupId={startup.id} />
                      </div>
                    </div>
                  )}

                  {startup.status === "PENDING_REVIEW" && (
                    <div className="space-y-2">
                      <p className="flex items-start gap-2 rounded-xl bg-yellow-50 px-3 py-2.5 text-sm text-yellow-900">
                        <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                        Under review. We’ll email you when it’s approved.
                      </p>
                      {startup._count.comments > 0 && (
                        <Link href={`/startup/${startup.id}/discussion`} className={`${actionClass} w-full`}>
                          <MessageSquare size={14} aria-hidden="true" /> Discussion <span className={countClass}>{startup._count.comments}<span className="sr-only"> comments</span></span>
                        </Link>
                      )}
                    </div>
                  )}

                  {startup.status === "REJECTED" && (
                    <div className="space-y-2">
                      <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                        <p className="font-semibold">Changes needed</p>
                        {startup.adminNotes && <p className="mt-0.5 line-clamp-2">{startup.adminNotes}</p>}
                      </div>
                      <Link href={`/startup/${startup.id}/edit`} className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
                        <RefreshCw size={14} aria-hidden="true" /> Edit and resubmit
                      </Link>
                    </div>
                  )}

                  {startup.status === "SUSPENDED" && (
                    <p className="flex items-start gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-sm text-orange-900">
                      <AlertCircle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                      <span>This listing is suspended and hidden from the public. <Link href="/contact" className="font-semibold underline underline-offset-2">Contact us</Link> for help.</span>
                    </p>
                  )}
                </div>

                {/* Permanent actions stay last, away from everyday ones. */}
                <div className="mt-auto flex justify-end border-t border-gray-100 px-3 py-1">
                  <DeleteStartupButton startupId={startup.id} startupName={startup.name} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <DashboardModeControl enabled={true} />
      </div>

      <p className="mt-8 border-t border-gray-200 pt-5 text-sm text-gray-600">Need a hand? <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-coral-700 underline underline-offset-4">Contact us</Link></p>
    </div>
  );
}
