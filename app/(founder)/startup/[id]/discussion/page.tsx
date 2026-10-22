import { loginHref } from "@/lib/login-return";
import { seoMetadata } from "@/lib/seo";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import FounderDiscussionPanel from "./FounderDiscussionPanel";

export const metadata = { ...seoMetadata({ title: "Startup discussion — Anshkosh", description: "Manage your startup workspace.", path: "/dashboard" }), robots: { index: false, follow: false } };

export default async function FounderDiscussionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !session.user) {
    redirect(loginHref((await headers()).get("x-anshkosh-path")));
  }

  const startup = await db.startup.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, slug: true, founderId: true },
  });

  if (!startup) notFound();

  if (startup.founderId !== session.user.id) {
    redirect("/dashboard");
  }

  const comments = await db.comment.findMany({
    where: { startupId: startup.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      authorName: true,
      body: true,
      reply: true,
      repliedBy: true,
      repliedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <MessageSquare className="w-6 h-6 text-coral-500" />
            <h1 className="text-2xl font-bold font-heading text-gray-900">Discussion</h1>
          </div>
          <p className="text-sm text-gray-500">
            Reply to visitor comments on{" "}
            <Link
              href={`/startups/${startup.slug}`}
              target="_blank"
              className="text-coral-600 hover:underline font-medium"
            >
              {startup.name}
            </Link>
            . Your replies appear immediately on the public page.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
          {comments.length} approved comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Reply panel */}
      <FounderDiscussionPanel
        comments={comments.map((c) => ({
          ...c,
          repliedAt: c.repliedAt?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
