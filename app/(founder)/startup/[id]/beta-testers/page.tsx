import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import BetaTesterManager from "@/components/dashboard/BetaTesterManager";
import { pageNumber, pageHref } from "@/lib/pagination";
import { activeBetaRequests, daysAgo, BETA_PENDING_DAYS } from "@/lib/beta-retention";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BetaTestersPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ page?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned) redirect("/login");
  const { id } = await params;
  const page = pageNumber((await searchParams)?.page);
  const pageSize = 20;

  const startup = await db.startup.findFirst({
    where: { id, founderId: session.user.id },
    select: { id: true, name: true, slug: true, status: true },
  });
  if (!startup) notFound();

  const program = await db.betaTesterProgram.findUnique({
    where: { startupId: startup.id },
    select: {
      id: true,
      enabled: true,
      description: true,
      reward: true,
      requests: {
        where: activeBetaRequests(),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, email: true, message: true, status: true, createdAt: true },
      },
    },
  });
  const [total, pendingTotal] = program ? await Promise.all([
    db.betaTesterRequest.count({ where: { programId: program.id, ...activeBetaRequests() } }),
    db.betaTesterRequest.count({ where: { programId: program.id, status: "PENDING", createdAt: { gte: daysAgo(BETA_PENDING_DAYS) } } }),
  ]) : [0, 0];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const requests = (program?.requests ?? []).map((request) => ({
    id: request.id,
    name: request.name,
    email: request.status === "APPROVED" ? request.email : null,
    message: request.message,
    status: request.status as "PENDING" | "APPROVED",
    createdAt: request.createdAt.toISOString(),
  }));

  return <><BetaTesterManager
    startupId={startup.id}
    startupName={startup.name}
    startupSlug={startup.slug}
    startupLive={startup.status === "LIVE"}
    initialProgram={program ? { enabled: program.enabled, description: program.description, reward: program.reward } : null}
    requests={requests}
    pendingTotal={pendingTotal}
  />
    <nav aria-label="Beta request pages" className="mx-auto flex max-w-5xl justify-center gap-4 px-4 pb-8">
      {page > 1 && <Link href={pageHref(`/startup/${id}/beta-testers`, page - 1)} className="underline">Previous</Link>}
      <span>Page {page} of {totalPages} · {total} requests</span>
      {page < totalPages && <Link href={pageHref(`/startup/${id}/beta-testers`, page + 1)} className="underline">Next</Link>}
    </nav>
  </>;
}
