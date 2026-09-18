import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SettingsEditor from "./SettingsEditor";

export default async function AdminSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/admin/dashboard");
  }

  const dbSettings = await db.appSetting.findMany();
  
  const settingsMap = dbSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const settings = {
    upvote_milestones: settingsMap["upvote_milestones"] || "[10, 50, 100, 500]",
    maintenance_mode: settingsMap["maintenance_mode"] || "false",
    max_startups_per_user: settingsMap["max_startups_per_user"] || "1",
    contact_notification_emails:
      settingsMap["contact_notification_emails"] || "",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-heading">System Settings</h1>
      </div>

      <SettingsEditor initialSettings={settings} />
    </div>
  );
}
