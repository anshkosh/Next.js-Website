import { loginHref } from "@/lib/login-return";
import { seoMetadata } from "@/lib/seo";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import EditStartupForm from "./EditStartupForm";
import { revisionPatch } from "@/lib/startup-revisions";

export const metadata = { ...seoMetadata({ title: "Edit startup — Anshkosh", description: "Manage your startup workspace.", path: "/dashboard" }), robots: { index: false, follow: false } };

export default async function EditStartupPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect(loginHref((await headers()).get("x-anshkosh-path")));
  }

  const startup = await db.startup.findUnique({
    where: { id: params.id },
  });

  if (!startup) {
    notFound();
  }

  if (startup.founderId !== session.user.id) {
    redirect("/dashboard");
  }

  if (startup.status !== "DRAFT" && startup.status !== "REJECTED" && startup.status !== "LIVE") {
    redirect("/dashboard");
  }

  const [revision, categories] = await Promise.all([
    db.startupRevision.findUnique({ where: { startupId: startup.id } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, iconName: true } }),
  ]);
  const initialData = revision && startup.status === "LIVE"
    ? { ...startup, ...revisionPatch(revision.data, startup.id), updatedAt: revision.updatedAt, revisionStatus: revision.status, revisionNotes: revision.notes }
    : startup;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 font-heading">Edit Startup</h1>
      <EditStartupForm initialData={initialData} userId={session.user.id} categories={categories} />
    </div>
  );
}
