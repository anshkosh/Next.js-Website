import { loginHref } from "@/lib/login-return";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { startupIdSchema } from "@/lib/validators/id.schema";
import { launchKitFromProfile } from "@/lib/launch-resources";
import LaunchKit from "@/components/launch/LaunchKit";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";

export const metadata: Metadata = { title: "Anshkosh — Your Startup Launch Kit", robots: { index: false, follow: false } };

export default async function StartupLaunchKitPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(loginHref((await headers()).get("x-anshkosh-path")));
  const { id } = await params;
  if (!startupIdSchema.safeParse(id).success) notFound();
  // Ownership is enforced in the query. Never load arbitrary users' drafts,
  // contacts, moderation notes, metadata or private pitch decks into the kit.
  const startup = await db.startup.findFirst({
    where: { id, founderId: session.user.id },
    select: {
      name: true, tagline: true, description: true, websiteUrl: true,
      targetAudience: true, prototypeStatus: true, tractionEvidence: true,
      logoUrl: true, galleryImages: true,
      founders: { orderBy: { sortOrder: "asc" }, select: { name: true, role: true } },
    },
  });
  if (!startup) notFound();
  return <LaunchToolLayout active="kit" title={`${startup.name} launch kit`} description="Reuse your saved profile without publishing or changing it."><LaunchKit fromProfile initialData={launchKitFromProfile(startup)} /></LaunchToolLayout>;
}
