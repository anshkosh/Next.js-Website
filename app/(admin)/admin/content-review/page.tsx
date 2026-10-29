import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { journalPage } from "@/lib/founder-journal";
import { moderationSource } from "@/lib/moderation-source";
import { moderationConfig } from "@/lib/moderation-worker";
import ReviewButtons from "./ReviewButtons";

export const dynamic = "force-dynamic";
export default async function ContentReviewPage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned || !["admin", "reviewer"].includes(session.user.role ?? "")) redirect("/admin/login");
  const params = await searchParams;
  const page = journalPage(params.page);
  const published = params.view === "published";
  const rows = await db.contentModeration.findMany({ where: published ? { kind: { not: "JOURNAL" }, status: { in: ["SAFE", "APPROVED"] } } : { OR: [{ status: { in: ["PENDING", "CHECKING", "FLAGGED", "UNAVAILABLE"] } }, { kind: "JOURNAL", status: "SAFE", revision: { status: "PENDING_REVIEW", entry: { visibility: "PUBLIC" } } }] }, orderBy: { createdAt: "asc" }, skip: (page - 1) * 50, take: 51 });
  const items = await Promise.all(rows.slice(0, 50).map(async row => {
    const source = await moderationSource(db, row, published);
    let history: { label: string; text: string; createdAt: Date }[] = [];
    if (row.kind === "UPDATE") history = (await db.startupUpdateRevision.findMany({ where: { updateId: row.targetId }, orderBy: { createdAt: "desc" }, take: 20, select: { title: true, body: true, createdAt: true } })).map(item => ({ label: item.title, text: item.body, createdAt: item.createdAt }));
    if (row.kind === "COMMENT") history = (await db.commentRevision.findMany({ where: { commentId: row.targetId }, orderBy: { createdAt: "desc" }, take: 20, select: { authorName: true, body: true, createdAt: true } })).map(item => ({ label: item.authorName, text: item.body, createdAt: item.createdAt }));
    if (row.kind === "REPLY") history = (await db.founderReplyRevision.findMany({ where: { commentId: row.targetId }, orderBy: { createdAt: "desc" }, take: 20, select: { repliedBy: true, reply: true, createdAt: true } })).map(item => ({ label: item.repliedBy ?? "Founder", text: item.reply, createdAt: item.createdAt }));
    return { row, source, history };
  }));
  return <div className="mx-auto max-w-4xl space-y-6">
    <h1 className="font-heading text-3xl font-bold">Content review</h1>
    <nav aria-label="Content review view" className="flex gap-4 text-sm font-semibold"><Link href="/admin/content-review" className="underline">Awaiting review</Link><Link href="/admin/content-review?view=published" className="underline">Published content and overrides</Link></nav>
    <p className="text-sm text-gray-700">{moderationConfig() ? "AI text checks are enabled. Blunt product criticism is allowed. Safe comments, replies and text updates may publish automatically; possible threats, personal abuse and profanity are held for review." : "AI checks are not configured. Submissions stay pending for human review."} Public journals always need editorial approval. Images and videos need a person to review them.</p>
    <p className="text-sm text-gray-600">Checks use Cloudflare Workers AI on the Free plan, with at most 100 requests per UTC day. An unavailable check keeps content pending. <Link href="/admin/comments" className="underline">Comment queue</Link> · <Link href="/admin/founder-journal" className="underline">Journal review</Link></p>
    {!items.some(item => item.source) && <p className="rounded-xl border bg-white p-6">No current submissions on this page.</p>}
    {items.map(({ row, source, history }) => source && <article key={`${row.id}-${row.contentHash}`} className="space-y-4 rounded-xl border bg-white p-5">
      <div><h2 className="text-lg font-semibold">{row.kind === "JOURNAL" ? "Public founder journal" : row.kind === "UPDATE" ? "Startup update" : row.kind === "REPLY" ? "Founder reply" : "Comment"}</h2><p className="mt-1 text-sm text-gray-600">{published ? "Published; a reviewer can override this decision" : row.status === "SAFE" ? "AI found no text safety issue; awaiting editorial review" : row.status === "FLAGGED" ? "Needs human review" : row.status === "UNAVAILABLE" ? "AI unavailable; awaiting review" : "Awaiting AI or human review"} · <Link href={`/startups/${source.slug}`} className="underline">View startup</Link></p></div>
      <p className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-sm">{source.content.text}</p>
      {history.length > 0 && <details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Edit history ({history.length})</summary><div className="mt-3 space-y-3">{history.map((item, index) => <div key={index} className="rounded bg-gray-50 p-3"><p className="text-xs text-gray-500">{item.label} · {item.createdAt.toLocaleString("en-IN")}</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.text}</p></div>)}</div></details>}
      {row.reasons.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">{row.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
      {source.mediaUrl && <a href={source.mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold underline">Open submitted image for review</a>}
      {source.content.hasMedia && <p className="text-sm">Review the attached media before approving. Journal media is shown in the journal review queue.</p>}
      {row.kind === "JOURNAL" ? <Link href="/admin/founder-journal" className="inline-flex min-h-11 items-center font-semibold text-coral-700 underline">Review journal submission</Link> : <ReviewButtons id={row.id} hash={row.contentHash} published={published} />}
    </article>)}
    <nav aria-label="Content review pages" className="flex gap-4 text-sm font-semibold">{page > 1 && <Link href={`?page=${page - 1}${published ? "&view=published" : ""}`}>Previous</Link>}{rows.length > 50 && <Link href={`?page=${page + 1}${published ? "&view=published" : ""}`}>Next</Link>}</nav>
  </div>;
}
