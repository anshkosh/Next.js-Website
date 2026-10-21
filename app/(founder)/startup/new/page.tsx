import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettingValue } from "@/app/actions/settings.actions";
import { wizardFields, wizardStep } from "@/lib/startup-wizard";
import StartupWizard from "./StartupWizard";

export default async function NewStartupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/register");
  const profile = await db.user.findUnique({
    where: { id: session.user.id },
    select: { founderMode: true },
  });
  if (!profile?.founderMode)
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">
          Ready to share your startup?
        </h1>
        <p className="mt-3 text-gray-600">
          Enable founder mode on your dashboard to open your startup
          workspace.
        </p>
        <Link
          href="/dashboard#founder-mode-control"
          className="mt-5 inline-flex min-h-11 items-center font-semibold text-coral-700 underline"
        >
          Open dashboard
        </Link>
      </div>
    );
  const params = await searchParams;
  const draftId = typeof params.draft === "string" ? params.draft : null;
  let draft = draftId
    ? await db.startup.findFirst({
        where: { id: draftId, founderId: session.user.id, status: "DRAFT" },
      })
    : null;
  if (draftId && !draft) redirect("/dashboard");
  if (!draft) {
    const limit = Math.max(
      1,
      parseInt(await getSettingValue("max_startups_per_user", "1"), 10) || 1,
    );
    const count = await db.startup.count({
      where: { founderId: session.user.id },
    });
    if (count >= limit) {
      const existingDraft = await db.startup.findFirst({
        where: { founderId: session.user.id, status: "DRAFT" },
        orderBy: { updatedAt: "desc" },
      });
      draft = existingDraft;
      if (!draft)
        return (
          <div className="mx-auto w-full max-w-2xl px-4 py-12">
            <h1 className="font-heading text-2xl font-bold">
              Your startup allowance is in use
            </h1>
            <p className="mt-3 text-gray-600">
              Your account can have {limit} startup{limit === 1 ? "" : "s"}. You
              can manage your existing submissions from your dashboard.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex min-h-11 items-center font-semibold text-coral-700 underline"
            >
              Go to dashboard
            </Link>
          </div>
        );
    }
  }
  return (
    <StartupWizard
      userId={session.user.id}
      initialId={draft?.id ?? null}
      initialStep={draft ? wizardStep(params.step) : 1}
      initialData={wizardFields(draft)}
    />
  );
}
