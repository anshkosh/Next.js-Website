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

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #fafafa 0%, #f0f4ff 40%, #fff5f2 100%)",
      }}
    >
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-6xl">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 tracking-tight">
            Welcome back,{" "}
            <span className="text-coral-500">
              {session.user.name?.split(" ")[0] || "Founder"}
            </span>
            ! 👋
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            Here’s what’s happening with your startups today.
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
                Total Signals
              </p>
              <p className="text-3xl font-bold text-gray-900 leading-none">
                {totalSignals}
              </p>
              <p className="mt-1 text-xs text-gray-500">Upvotes minus downvotes</p>
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

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Startups</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {totalStartups} of {maxStartups} startup slot
              {maxStartups !== 1 ? "s" : ""} used
            </p>
          </div>

          <div className="relative group">
            {isAtLimit ? (
              <button
                disabled
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 text-gray-400 rounded-xl font-semibold cursor-not-allowed text-sm"
              >
                <Plus size={16} /> Submit a New Startup
              </button>
            ) : (
              <Link
                href="/startup/new"
                className="flex items-center gap-2 px-5 py-2.5 bg-coral-500 text-white rounded-xl font-semibold hover:bg-coral-600 transition-colors shadow-sm text-sm"
              >
                <Plus size={16} /> Submit a New Startup
              </Link>
            )}
            {isAtLimit && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Maximum {maxStartups} startup{maxStartups === 1 ? "" : "s"}{" "}
                allowed
              </div>
            )}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DeleteStartupButton
                      startupId={startup.id}
                      startupName={startup.name}
                    />
                  </div>

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
                          {startup.signalCount} signals
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
                    <div className="mb-3"><FounderWorkspace /></div>
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
      </div>
    </div>
  );
}
