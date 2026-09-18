import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import EditStartupForm from "./EditStartupForm";

export default async function EditStartupPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
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

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 font-heading">Edit Startup</h1>
      <EditStartupForm initialData={startup} />
    </div>
  );
}
