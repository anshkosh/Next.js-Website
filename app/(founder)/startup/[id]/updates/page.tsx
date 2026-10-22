import { loginHref } from "@/lib/login-return";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import UpdateManager from "@/components/startup/UpdateManager";

export default async function StartupUpdatesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user) {
    redirect(loginHref((await headers()).get("x-anshkosh-path")));
  }

  const startup = await db.startup.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, slug: true, founderId: true, status: true },
  });

  if (!startup) notFound();

  if (startup.founderId !== session.user.id) {
    redirect("/dashboard");
  }

  // Updates are only meaningful for LIVE startups
  if (startup.status !== "LIVE") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-full bg-coral-50 text-coral-500 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-gray-900">
              Founder updates
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Post milestones and news for{" "}
              <Link
                href={`/startups/${startup.slug}`}
                target="_blank"
                className="text-coral-600 hover:underline font-medium"
              >
                {startup.name}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-start gap-2.5">
        <span className="mt-0.5 text-base">💡</span>
        <span>
          Updates appear on your public startup page and keep your audience engaged. They do{" "}
          <strong>not</strong> require admin review — they go live immediately.
        </span>
      </div>

      {/* Update Manager */}
      <UpdateManager startupId={startup.id} />
    </div>
  );
}
