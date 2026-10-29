import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import CommentModerationList from "./CommentModerationList";

export const dynamic = "force-dynamic";

const statuses = [
  { value: "PENDING", label: "Needs review" },
  { value: "APPROVED", label: "Published" },
  { value: "REJECTED", label: "Hidden or rejected" },
] as const;

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned || !["admin", "reviewer"].includes(session.user.role ?? "")) redirect("/admin/login");

  const params = await searchParams;
  const status = statuses.some(item => item.value === params.status) ? params.status as typeof statuses[number]["value"] : "PENDING";
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isSafeInteger(parsedPage) ? Math.max(1, Math.min(parsedPage, 10_000)) : 1;
  const pageSize = 25;
  const where = {
    status,
    ...(query ? { OR: [
      { id: { contains: query, mode: "insensitive" as const } },
      { authorName: { contains: query, mode: "insensitive" as const } },
      { authorEmail: { contains: query, mode: "insensitive" as const } },
      { body: { contains: query, mode: "insensitive" as const } },
      { startup: { name: { contains: query, mode: "insensitive" as const } } },
    ] } : {}),
  };
  const rows = await db.comment.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
    include: {
      startup: { select: { id: true, name: true, slug: true } },
      moderations: { select: { status: true, reasons: true, reviewedAt: true, reviewedBy: true }, take: 1 },
      revisions: { select: { authorName: true, body: true, editorId: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 },
      replyRevisions: { select: { reply: true, repliedBy: true, editorId: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  const linkedUserIds = [...new Set(rows.map(comment => comment.authorUserId).filter((id): id is string => Boolean(id)))];
  const linkedUsers = linkedUserIds.length ? await db.user.findMany({ where: { id: { in: linkedUserIds } }, select: { id: true, role: true } }) : [];
  const linkedRoleById = new Map(linkedUsers.map(user => [user.id, user.role]));
  const comments = rows.slice(0, pageSize).map(comment => ({
    id: comment.id,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    authorHasLinkedAccount: Boolean(comment.authorUserId),
    authorUserRole: comment.authorUserId ? linkedRoleById.get(comment.authorUserId) ?? null : null,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt.toISOString(),
    reviewedAt: comment.reviewedAt?.toISOString() ?? null,
    reviewedBy: comment.reviewedBy,
    review: comment.moderations[0] ? {
      status: comment.moderations[0].status,
      reasons: comment.moderations[0].reasons,
      reviewedAt: comment.moderations[0].reviewedAt?.toISOString() ?? null,
      reviewedBy: comment.moderations[0].reviewedBy,
    } : null,
    reviewNote: comment.reviewNote,
    revisions: comment.revisions.map(item => ({ ...item, createdAt: item.createdAt.toISOString() })),
    replyRevisions: comment.replyRevisions.map(item => ({ ...item, createdAt: item.createdAt.toISOString() })),
    startup: comment.startup,
  }));
  const hasNext = rows.length > pageSize;

  return <div className="mx-auto max-w-5xl space-y-6">
    <header className="space-y-2">
      <h1 className="font-heading text-3xl font-bold">Comment controls</h1>
      <p className="text-sm text-gray-600">Review, publish, hide, restore or restrict a commenter. Product criticism stays publishable; account bans are limited to verified ordinary users linked to their comment.</p>
    </header>

    <nav aria-label="Comment status" className="flex flex-wrap gap-2">
      {statuses.map(item => <Link key={item.value} href={`/admin/comments?status=${item.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`} aria-current={status === item.value ? "page" : undefined} className={`min-h-10 rounded-full border px-4 py-2 text-sm font-semibold ${status === item.value ? "border-coral-700 bg-coral-700 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
        {item.label}
      </Link>)}
      <Link href="/admin/bans" className="min-h-10 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Active bans</Link>
    </nav>

    <form method="get" className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row">
      <input type="hidden" name="status" value={status} />
      <label htmlFor="comment-search" className="sr-only">Search comments, commenters, or startups</label>
      <input id="comment-search" name="q" defaultValue={query} maxLength={100} placeholder="Search text, commenter, email or startup" className="min-h-11 min-w-0 flex-1 rounded-lg border px-3" />
      <button className="min-h-11 rounded-lg bg-gray-900 px-5 font-semibold text-white">Search</button>
      {query && <Link href={`/admin/comments?status=${status}`} className="inline-flex min-h-11 items-center px-3 text-sm underline">Clear</Link>}
    </form>

    <p className="text-sm text-gray-600">Showing {comments.length} {status.toLowerCase()} comments · Page {page}</p>
    <CommentModerationList comments={comments} canDeletePending={session.user.role === "admin"} />
    <nav aria-label="Comment pages" className="flex justify-between">
      {page > 1 ? <Link className="min-h-11 inline-flex items-center underline" href={`/admin/comments?status=${status}&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>Previous page</Link> : <span />}
      {hasNext && <Link className="min-h-11 inline-flex items-center underline" href={`/admin/comments?status=${status}&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}>Next page</Link>}
    </nav>
  </div>;
}
