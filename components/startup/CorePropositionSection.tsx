import { Target, Lightbulb, Users, Wrench, TrendingUp } from "lucide-react";

type Props = {
  problemStatement?: string | null;
  solutionStatement?: string | null;
  targetAudience?: string | null;
  prototypeStatus?: string | null;
  tractionEvidence?: string | null;
};

const BUILD_STATUS_COLORS: Record<string, string> = {
  "Working Software Prototype (Functional Beta)":
    "bg-blue-50 text-blue-700 border-blue-200",
  "Physical Prototype / Hardware Sample Built":
    "bg-purple-50 text-purple-700 border-purple-200",
  "Production-Ready V1 (Preparing Pilot Run)":
    "bg-amber-50 text-amber-700 border-amber-200",
  "Active Live Service (Testing New Feature/Location)":
    "bg-green-50 text-green-700 border-green-200",
};

function PropCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-coral-500 shadow-sm flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function CorePropositionSection({
  problemStatement,
  solutionStatement,
  targetAudience,
  prototypeStatus,
  tractionEvidence,
}: Props) {
  const hasAnyContent =
    problemStatement ||
    solutionStatement ||
    targetAudience ||
    prototypeStatus ||
    tractionEvidence;

  if (!hasAnyContent) return null;

  const statusColorClass =
    prototypeStatus && BUILD_STATUS_COLORS[prototypeStatus]
      ? BUILD_STATUS_COLORS[prototypeStatus]
      : "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">
            Core Proposition
          </h2>
          <p className="text-sm text-gray-500">
            Problem, solution, audience &amp; current build stage
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Problem */}
        {problemStatement && (
          <PropCard
            icon={<span className="text-base">🔴</span>}
            title="The Problem"
          >
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {problemStatement}
            </p>
          </PropCard>
        )}

        {/* Solution */}
        {solutionStatement && (
          <PropCard
            icon={<Lightbulb className="w-4 h-4" />}
            title="Solution &amp; Value Proposition"
          >
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {solutionStatement}
            </p>
          </PropCard>
        )}

        {/* Target Audience */}
        {targetAudience && (
          <PropCard
            icon={<Users className="w-4 h-4" />}
            title="Target Audience &amp; Ideal Customer"
          >
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {targetAudience}
            </p>
          </PropCard>
        )}

        {/* Build Status */}
        {prototypeStatus && (
          <PropCard
            icon={<Wrench className="w-4 h-4" />}
            title="Prototype / Build Status"
          >
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusColorClass}`}
            >
              {prototypeStatus}
            </span>
          </PropCard>
        )}

        {/* Traction */}
        {tractionEvidence && (
          <PropCard
            icon={<TrendingUp className="w-4 h-4" />}
            title="Proof Points &amp; Traction"
          >
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {tractionEvidence}
            </p>
          </PropCard>
        )}
      </div>
    </div>
  );
}
