import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import BetaTesterManager from "@/components/dashboard/BetaTesterManager";

export const dynamic = "force-dynamic";

export default async function BetaTestersPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const { id } = await params;

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
        where: { status: { in: ["PENDING", "APPROVED"] } },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, message: true, status: true, createdAt: true },
      },
    },
  });

  const requests = (program?.requests ?? []).map((request) => ({
    id: request.id,
    name: request.name,
    email: request.status === "APPROVED" ? request.email : null,
    message: request.message,
    status: request.status as "PENDING" | "APPROVED",
    createdAt: request.createdAt.toISOString(),
  }));

  return <BetaTesterManager
    startupId={startup.id}
    startupName={startup.name}
    startupSlug={startup.slug}
    startupLive={startup.status === "LIVE"}
    initialProgram={program ? { enabled: program.enabled, description: program.description, reward: program.reward } : null}
    requests={requests}
  />;
}
