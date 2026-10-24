import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BanAction } from "./BanActions";

export const dynamic = "force-dynamic";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return name && domain ? `${name.slice(0, 1)}***@${domain}` : "Private email";
}

export default async function ModerationBansPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned || !["admin", "reviewer"].includes(session.user.role ?? "")) redirect("/admin/login");
  const now = new Date();
  const [accountBans, blocks] = await Promise.all([
    db.moderationAccountBan.findMany({ where: { revokedAt: null }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.commenterBlock.findMany({ where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const userIds = [...new Set([...accountBans.map(item => item.targetUserId), ...accountBans.map(item => item.createdById), ...blocks.map(item => item.createdById)].filter((id): id is string => Boolean(id)))];
  const commentIds = [...new Set([...accountBans.map(item => item.sourceCommentId).filter((id): id is string => Boolean(id)), ...blocks.map(item => item.sourceCommentId).filter((id): id is string => Boolean(id))])];
  const [users, comments] = await Promise.all([
    userIds.length ? db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, role: true } }) : [],
    commentIds.length ? db.comment.findMany({ where: { id: { in: commentIds } }, select: { id: true, authorName: true, authorEmail: true, startup: { select: { name: true, slug: true } } } }) : [],
  ]);
  const userById = new Map(users.map(user => [user.id, user]));
  const commentById = new Map(comments.map(comment => [comment.id, comment]));
  const activeAccountBanIds = new Set(accountBans.filter(item => !item.expiresAt || item.expiresAt > now).map(item => item.id));

  return <div className="mx-auto max-w-5xl space-y-7">
    <header className="space-y-2">
      <h1 className="font-heading text-3xl font-bold">Banned accounts and blocked commenters</h1>
      <p className="text-sm text-gray-600">Moderators can restrict ordinary user accounts from a comment linked to their verified account, or block an email address from commenting. Staff accounts cannot be banned here.</p>
      <Link href="/admin/comments" className="inline-flex min-h-10 items-center text-sm font-semibold text-coral-700 underline">Back to comment review</Link>
    </header>

    <section className="space-y-3">
      <h2 className="text-xl font-bold">Account bans ({accountBans.length})</h2>
      {!accountBans.length && <p className="rounded-xl border bg-white p-6 text-sm text-gray-600">No active or expired moderation account bans.</p>}
      {accountBans.map(ban => {
        const user = userById.get(ban.targetUserId);
        const actor = ban.createdById ? userById.get(ban.createdById) : null;
        const comment = ban.sourceCommentId ? commentById.get(ban.sourceCommentId) : null;
        const expired = Boolean(ban.expiresAt && ban.expiresAt <= now);
        return <article key={ban.id} className="flex flex-col gap-4 rounded-xl border bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-sm">
            <h3 className="font-semibold">{user ? `${user.name} · ${user.email}` : "Account no longer exists"}</h3>
            <p className="text-gray-600">{ban.reason}</p>
            <p className="text-gray-600">{expired ? `Expired ${ban.expiresAt!.toLocaleString("en-IN")}` : ban.expiresAt ? `Until ${ban.expiresAt.toLocaleString("en-IN")}` : "Until removed"} · Applied {ban.createdAt.toLocaleString("en-IN")}{actor ? ` by ${actor.name}` : " by a staff member"}</p>
            {comment && <p className="text-gray-600">From <Link href={`/startups/${comment.startup.slug}`} className="underline">{comment.startup.name}</Link> comment by {comment.authorName}</p>}
          </div>
          <BanAction id={ban.id} kind="account" />
        </article>;
      })}
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-bold">Comment-only email blocks ({blocks.length})</h2>
      <p className="text-sm text-gray-600">Email addresses are stored as keyed hashes for these restrictions. This does not block sign-in to an Anshkosh account.</p>
      {!blocks.length && <p className="rounded-xl border bg-white p-6 text-sm text-gray-600">No active email blocks.</p>}
      {blocks.map(block => {
        const comment = block.sourceCommentId ? commentById.get(block.sourceCommentId) : null;
        const actor = block.createdById ? userById.get(block.createdById) : null;
        const linkedBanIsActive = Boolean(block.accountBanId && activeAccountBanIds.has(block.accountBanId));
        return <article key={block.id} className="flex flex-col gap-4 rounded-xl border bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-sm">
            <h3 className="font-semibold">{comment ? `${comment.authorName} · ${maskEmail(comment.authorEmail)}` : "Commenter email restriction"}</h3>
            <p className="text-gray-600">{block.reason}</p>
            <p className="text-gray-600">{block.expiresAt ? `Until ${block.expiresAt.toLocaleString("en-IN")}` : "Until removed"} · Applied {block.createdAt.toLocaleString("en-IN")}{actor ? ` by ${actor.name}` : " by a staff member"}</p>
            {comment && <p className="text-gray-600">From <Link href={`/startups/${comment.startup.slug}`} className="underline">{comment.startup.name}</Link></p>}
            {linkedBanIsActive && <p className="font-medium text-amber-800">This block is part of an account ban; revoke the account ban to release both.</p>}
          </div>
          {!linkedBanIsActive && <BanAction id={block.id} kind="email" />}
        </article>;
      })}
    </section>
  </div>;
}
