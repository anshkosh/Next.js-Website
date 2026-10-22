"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/components/useHydrated";
import { authClient } from "@/lib/auth-client";
import { saveProfileSettings } from "@/app/actions/profile.actions";
import EditableImageUpload from "@/components/startup/EditableImageUpload";
import { accountSavedTime, accountToday } from "@/lib/account-dates";

type Profile = {
  name: string; image: string | null; bio: string; location: string; websiteUrl: string;
  notifyStartupReviews: boolean; notifyVoteMilestones: boolean;
  dateOfBirth: string;
};
const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-coral-600";

export default function ProfileSettings({ user }: { user: Profile }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [profile, setProfile] = useState({ name: user.name, image: user.image || "", bio: user.bio, location: user.location, websiteUrl: user.websiteUrl, dateOfBirth: user.dateOfBirth, notifyStartupReviews: user.notifyStartupReviews, notifyVoteMilestones: user.notifyVoteMilestones });
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState("");
  function field<K extends keyof typeof profile>(name: K, value: typeof profile[K]) {
    setProfile(previous => ({ ...previous, [name]: value })); setSavedAt(""); setError("");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setSavedAt(""); setError("");
    try {
      const result = await saveProfileSettings(profile);
      if (result.error) { setError(result.error); return; }
      setSavedAt(accountSavedTime());
      try { await authClient.getSession({ query: { disableCookieCache: true } }); } catch { /* Navigation refreshes the session. */ }
      router.refresh();
    } catch { setError("We could not confirm the save. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <form id="profile-settings" method="post" onSubmit={save} className="space-y-6 scroll-mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
    <fieldset disabled={!hydrated || busy} className="space-y-5">
      <legend className="mb-3 font-heading text-2xl font-bold text-gray-900">Your profile</legend>
      <p className="text-sm leading-relaxed text-gray-600">Your name, photo and introduction. Startup founding-team details are managed on each startup.</p>
      <div><p className="mb-2 text-sm font-semibold text-gray-800">Profile photo</p><EditableImageUpload kind="founder-photo" label="Profile photo" value={profile.image} onChange={value => field("image", value)} onBusyChange={setUploadBusy} /></div>
      <div><label htmlFor="profile-name" className="text-sm font-semibold text-gray-800">Full name</label><input id="profile-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={profile.name} onChange={e => field("name", e.target.value)} className={inputClass} /></div>
      <div><label htmlFor="profile-bio" className="text-sm font-semibold text-gray-800">Bio</label><textarea id="profile-bio" name="bio" rows={3} maxLength={500} value={profile.bio} onChange={e => field("bio", e.target.value)} aria-describedby="profile-bio-help" className={inputClass} /><p id="profile-bio-help" className="mt-1 text-xs text-gray-600">A little about you and your interests. <span className="tabular-nums">{profile.bio.length}/500</span></p></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="profile-location" className="text-sm font-semibold text-gray-800">Location</label><input id="profile-location" name="location" autoComplete="address-level2" maxLength={100} value={profile.location} onChange={e => field("location", e.target.value)} className={inputClass} /></div>
        <div><label htmlFor="profile-website" className="text-sm font-semibold text-gray-800">Website</label><input id="profile-website" name="websiteUrl" type="url" inputMode="url" placeholder="https://example.com" maxLength={500} value={profile.websiteUrl} onChange={e => field("websiteUrl", e.target.value)} className={inputClass} /></div>
      </div>
    </fieldset>
    <fieldset id="personal-details" disabled={!hydrated || busy} className="scroll-mt-6 space-y-5 border-t border-gray-200 pt-6">
      <legend className="pr-3 text-xl font-semibold text-gray-900">Personal details</legend>
      <div><label htmlFor="profile-birth-date" className="text-sm font-semibold text-gray-800">Date of birth <span className="font-normal text-gray-600">(optional)</span></label><input id="profile-birth-date" name="dateOfBirth" type="date" autoComplete="bday" max={accountToday()} value={profile.dateOfBirth} onChange={e => field("dateOfBirth", e.target.value)} aria-describedby="profile-birth-date-help" className={inputClass} /><p id="profile-birth-date-help" className="mt-1 text-xs text-gray-600">Private account information. It is not shown on public profiles. Clear the date and save to remove it.</p></div>
    </fieldset>
    <fieldset id="email-notifications" disabled={!hydrated || busy} className="scroll-mt-6 space-y-5 border-t border-gray-200 pt-6">
      <legend className="pr-3 text-xl font-semibold text-gray-900">Email notifications</legend>
      <label className="flex min-h-11 cursor-pointer items-start gap-3"><input type="checkbox" checked={profile.notifyStartupReviews} onChange={e => field("notifyStartupReviews", e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-coral-600" /><span><span className="block font-semibold text-gray-800">Startup review updates</span><span className="mt-1 block text-sm text-gray-600">Emails when your startup or profile changes are approved or need attention.</span></span></label>
      <label className="flex min-h-11 cursor-pointer items-start gap-3"><input type="checkbox" checked={profile.notifyVoteMilestones} onChange={e => field("notifyVoteMilestones", e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-coral-600" /><span><span className="block font-semibold text-gray-800">Vote milestones</span><span className="mt-1 block text-sm text-gray-600">Emails when your startup reaches a voting milestone.</span></span></label>
      <p className="text-sm leading-relaxed text-gray-600">Security, verification and account-recovery emails are always sent. Newsletter consent is managed separately through the newsletter’s unsubscribe link.</p>
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div role="status" className="text-sm text-green-800">{savedAt && <><span>Profile saved.</span> <span className="tabular-nums">Saved at {savedAt}.</span></>}</div>
    <div className="flex flex-wrap items-center gap-5">
      <button disabled={!hydrated || busy || uploadBusy} className="min-h-11 rounded-xl bg-coral-600 px-5 font-semibold text-white hover:bg-coral-700 disabled:opacity-60">{busy ? "Saving…" : "Save profile"}</button>
    </div>
  </form>;
}
