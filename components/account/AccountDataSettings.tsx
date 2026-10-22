"use client";

import { useState } from "react";
import Link from "next/link";
import { useHydrated } from "@/components/useHydrated";
import { deleteMyAccount, requestAccountPrivacyCode } from "@/app/actions/account-privacy.actions";

const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-coral-600";
const buttonClass = "min-h-11 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60";

export default function AccountDataSettings({ emailVerified, canDelete }: { emailVerified: boolean; canDelete: boolean }) {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState("");
  const [downloadCode, setDownloadCode] = useState("");
  const [deletionCode, setDeletionCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [deletionStatus, setDeletionStatus] = useState("");
  const [deletionError, setDeletionError] = useState("");
  const disabled = !hydrated || !!busy || !emailVerified;

  async function requestCode(purpose: "export" | "delete") {
    const setError = purpose === "export" ? setDownloadError : setDeletionError;
    const setStatus = purpose === "export" ? setDownloadStatus : setDeletionStatus;
    setBusy(`request-${purpose}`); setError(""); setStatus("");
    try {
      const result = await requestAccountPrivacyCode({ purpose });
      if (result.error) setError(result.error);
      else {
        setStatus("Confirmation code emailed. It expires in 15 minutes. Use the newest code; wait one minute before requesting another.");
        if (purpose === "export") setDownloadCode(""); else setDeletionCode("");
      }
    } catch { setError("We could not confirm the email request. Please try again."); }
    finally { setBusy(""); }
  }

  async function download(event: React.FormEvent) {
    event.preventDefault(); setBusy("download"); setDownloadError(""); setDownloadStatus("");
    try {
      const response = await fetch("/api/account/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: downloadCode }) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setDownloadError(body.error || "Your download could not be prepared. Please try again."); return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = "anshkosh-account-data.json";
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setDownloadCode(""); setDownloadStatus("Your account data download is ready. Keep the file private. A new download needs a new confirmation code.");
    } catch { setDownloadError("We could not complete the download. If your code was already used, request a new one."); }
    finally { setBusy(""); }
  }

  async function remove(event: React.FormEvent) {
    event.preventDefault(); setDeletionError(""); setDeletionStatus("");
    if (confirmation !== "DELETE") { setDeletionError("Type DELETE to confirm."); return; }
    setBusy("delete");
    try {
      const result = await deleteMyAccount({ code: deletionCode, confirmation });
      if (result?.error) setDeletionError(result.error);
    } catch { setDeletionError("We could not confirm deletion. Check your connection and account before retrying."); }
    finally { setBusy(""); }
  }

  return <section id="account-data" aria-labelledby="account-data-heading" className="scroll-mt-6 space-y-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
    <h2 id="account-data-heading" className="font-heading text-2xl font-bold text-gray-900">Your data and account</h2>
    {!emailVerified && <p className="text-sm text-amber-800">Verify your email address in Sign-in and security before downloading data or deleting your account.</p>}
    <form method="post" onSubmit={download} className="space-y-4">
      <fieldset disabled={disabled} className="space-y-4">
        <legend className="mb-2 font-semibold text-gray-800">Download your data</legend>
        <p className="text-sm leading-relaxed text-gray-600">Download a JSON copy of your profile, preferences, linked sign-in providers, startups, journal entries and upload links. File attachments are downloaded separately. Passwords, sign-in tokens and other people’s comments or beta contact details are excluded.</p>
        <button type="button" onClick={() => requestCode("export")} className={buttonClass}>{busy === "request-export" ? "Sending…" : "Email download code"}</button>
        <div><label htmlFor="download-confirmation-code" className="text-sm font-semibold text-gray-800">Download confirmation code</label><input id="download-confirmation-code" name="downloadCode" required minLength={32} maxLength={32} autoComplete="one-time-code" autoCapitalize="none" spellCheck={false} value={downloadCode} onChange={e => setDownloadCode(e.target.value.trim())} className={`${inputClass} font-mono text-sm`} /></div>
        <button className={buttonClass}>{busy === "download" ? "Preparing…" : "Download my data"}</button>
      </fieldset>
      {downloadError && <p role="alert" className="text-sm text-red-700">{downloadError}</p>}
      <p role="status" className="text-sm text-green-800">{downloadStatus}</p>
    </form>
    <div id="delete-account" className="scroll-mt-6 border-t border-gray-200 pt-6">
      {canDelete ? <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-red-700 underline underline-offset-4">Delete account…</summary>
        <form method="post" onSubmit={remove} className="mt-4 space-y-4">
          <fieldset disabled={disabled} className="space-y-4">
            <legend className="mb-2 font-semibold text-gray-900">Permanently delete your account</legend>
            <p className="text-sm leading-relaxed text-gray-700">This cannot be undone. It deletes your account, all its startups and journal entries (including drafts and published content), sign-in methods and sessions. Your startups’ beta programs and applications are also removed. Upload removal is queued for retry. Download your data first if you want a copy.</p>
            <p className="text-sm leading-relaxed text-gray-600">Device-only drafts, separate anonymous votes/comments, beta applications to other startups and newsletter subscriptions are managed separately. Backups are not erased immediately; copies already saved by others cannot be recalled. <Link href="/privacy" className="text-coral-700 underline underline-offset-4">Privacy and deletion details</Link>.</p>
            <button type="button" onClick={() => requestCode("delete")} className={buttonClass}>{busy === "request-delete" ? "Sending…" : "Email deletion code"}</button>
            <div><label htmlFor="deletion-confirmation-code" className="text-sm font-semibold text-gray-800">Deletion confirmation code</label><input id="deletion-confirmation-code" name="deletionCode" required minLength={32} maxLength={32} autoComplete="off" autoCapitalize="none" spellCheck={false} value={deletionCode} onChange={e => setDeletionCode(e.target.value.trim())} className={`${inputClass} font-mono text-sm`} /></div>
            <div><label htmlFor="delete-confirmation" className="text-sm font-semibold text-gray-800">Type DELETE to confirm</label><input id="delete-confirmation" name="confirmation" required pattern="DELETE" autoComplete="off" spellCheck={false} value={confirmation} onChange={e => setConfirmation(e.target.value)} className={inputClass} /></div>
            <button disabled={disabled || confirmation !== "DELETE"} className="min-h-11 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">{busy === "delete" ? "Deleting…" : "Delete my account permanently"}</button>
          </fieldset>
          {deletionError && <p role="alert" className="text-sm text-red-700">{deletionError}</p>}
          <p role="status" className="text-sm text-green-800">{deletionStatus}</p>
        </form>
      </details> : <div className="space-y-3"><h3 className="font-semibold text-gray-800">Account deletion</h3><p className="text-sm leading-relaxed text-gray-600">Accounts with staff access need a responsibility handover before closure. <a href="mailto:hello@anshkosh.com" className="text-coral-700 underline underline-offset-4">Contact us to close this account</a>.</p></div>}
    </div>
    <p className="text-sm leading-relaxed text-gray-600">For separate records, larger exports or help with a privacy request, <a href="mailto:hello@anshkosh.com" className="text-coral-700 underline underline-offset-4">contact hello@anshkosh.com</a>.</p>
  </section>;
}
