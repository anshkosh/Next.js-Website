"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ExternalLink, Mail, Trash2, X } from "lucide-react";
import { clearOldBetaRequests, deleteBetaTesterRequest, reviewBetaTesterRequest, saveBetaTesterProgram } from "@/app/actions/beta-tester.actions";

type RequestRow = {
  id: string;
  name: string | null;
  email: string | null;
  message: string | null;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: string;
};

export default function BetaTesterManager({
  startupId,
  startupName,
  startupSlug,
  startupLive,
  initialProgram,
  requests,
  pendingTotal,
}: {
  startupId: string;
  startupName: string;
  startupSlug: string;
  startupLive: boolean;
  initialProgram: { enabled: boolean; description: string; reward: string | null } | null;
  requests: RequestRow[];
  pendingTotal?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialProgram?.enabled ?? false);
  const [description, setDescription] = useState(initialProgram?.description ?? "");
  const [reward, setReward] = useState(initialProgram?.reward ?? "");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const pendingRequests = pendingTotal ?? requests.filter((request) => request.status === "PENDING").length;

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await saveBetaTesterProgram(startupId, { enabled, description, reward });
      if (result.error) setFeedback({ type: "error", text: result.error });
      else {
        setFeedback({ type: "success", text: enabled ? "Beta tester signups are open on your startup page." : "Beta tester signups are closed." });
        router.refresh();
      }
    });
  };

  const handleReview = (requestId: string, decision: "APPROVED" | "DECLINED") => {
    setFeedback(null);
    startTransition(async () => {
      const result = await reviewBetaTesterRequest(requestId, decision);
      if (result.error) setFeedback({ type: "error", text: result.error });
      else {
        setFeedback({ type: "success", text: decision === "APPROVED" ? "Request approved. The tester’s email is now available for you to contact them." : "Request declined and the applicant’s personal details were removed." });
        router.refresh();
      }
    });
  };

  const handleDelete = (requestId: string) => {
    if (!window.confirm("Remove this beta tester request and its contact details?")) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteBetaTesterRequest(requestId);
      if (result.error) setFeedback({ type: "error", text: result.error });
      else {
        setFeedback({ type: "success", text: "Request and contact details removed." });
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7 px-4 py-8 md:py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-coral-700 underline underline-offset-4">← Dashboard</Link>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-gray-900">Beta testers for {startupName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">Invite interested people to request a spot. You review each request, then contact approved testers directly and arrange access yourself.</p>
        </div>
        <Link href={`/startups/${startupSlug}`} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50">View startup page <ExternalLink className="h-4 w-4" /></Link>
      </header>

      {feedback && <p role={feedback.type === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{feedback.text}</p>}

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-coral-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">Signup sheet</h2>
            <p className="mt-1 text-sm text-gray-600">Turn this on when you’re ready to review tester requests.</p>
          </div>
          <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-800">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} disabled={!startupLive} className="h-4 w-4 rounded border-gray-300 text-coral-600 focus:ring-coral-500" />
            {enabled ? "Open" : "Closed"}
          </label>
        </div>
        {!startupLive && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">This startup must be live before it can accept beta tester requests.</p>}
        <label className="block text-sm font-semibold text-gray-800">What will testers try?
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} required={enabled} placeholder="Describe the product or part of it you want people to test, and what kind of feedback would help." className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2 font-normal focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-100" />
          <span className="mt-1 block text-xs font-normal text-gray-500">{description.length}/1,000 characters</span>
        </label>
        <label className="block text-sm font-semibold text-gray-800">Optional tester perk or reward
          <textarea value={reward} onChange={(event) => setReward(event.target.value)} maxLength={500} rows={2} placeholder="For example: early access or a product credit. Be clear about any conditions." className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2 font-normal focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-100" />
          <span className="mt-1 block text-xs font-normal text-gray-500">{reward.length}/500 characters. Only offer what you can provide.</span>
        </label>
        <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">
          <p><strong className="text-gray-900">How it works:</strong> You’ll review a tester’s name and optional note. Their email stays hidden until you approve them. Then contact them directly and arrange product access, onboarding, support, and any reward.</p>
          <p className="mt-2">Anshkosh stores the request and consent record to route interest. It does not provide beta access or guarantee a reward. <Link href="/beta-consent" className="font-semibold text-coral-700 underline">Read the consent notice</Link>.</p>
        </div>
        <button type="submit" disabled={isPending || (enabled && !startupLive)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-coral-600 px-5 py-3 text-sm font-semibold text-white hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600 disabled:cursor-not-allowed disabled:opacity-50">{isPending ? "Saving…" : "Save beta signup settings"}</button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" aria-labelledby="beta-requests-title">
        <div className="space-y-3 border-b border-gray-100 p-5 text-sm text-gray-600">
          <p>Pending requests expire after 90 days. Approved contact details are removed 180 days after approval. Contact details are erased on expiry; minimal closed consent records are removed after a further year. You can remove requests sooner.</p>
          <button type="button" disabled={isPending} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 disabled:opacity-50" onClick={() => {
            if (!window.confirm("Remove personal details from pending requests older than 30 days? This cannot be undone.")) return;
            startTransition(async () => {
              const result = await clearOldBetaRequests(startupId);
              setFeedback(result.error ? { type: "error", text: result.error } : { type: "success", text: `${result.removed} old pending requests closed and contact details removed.` });
              router.refresh();
            });
          }}>Clear pending requests older than 30 days</button>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div><h2 id="beta-requests-title" className="font-heading text-lg font-bold text-gray-900">Tester requests</h2><p className="mt-0.5 text-xs text-gray-500">{pendingRequests} awaiting your review · email appears only after approval</p></div>
        </div>
        {requests.length === 0 ? <p className="p-8 text-center text-sm text-gray-500">No requests yet. Open the signup sheet to invite testers.</p> : <div className="divide-y divide-gray-100">
          {requests.filter((request) => request.status !== "DECLINED").map((request) => (
            <article key={request.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900">{request.name || "Tester"}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${request.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{request.status === "APPROVED" ? "Approved" : "Pending review"}</span></div>
                {request.message && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{request.message}</p>}
                <p className="mt-2 text-xs text-gray-400">Received {new Date(request.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" })}</p>
                {request.status === "APPROVED" && request.email && <a href={`mailto:${request.email}`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-coral-50 px-3 text-sm font-semibold text-coral-800 underline underline-offset-2"><Mail className="h-4 w-4" />{request.email}</a>}
              </div>
              <div className="flex shrink-0 gap-2">
                {request.status === "PENDING" && <>
                  <button type="button" onClick={() => handleReview(request.id, "APPROVED")} disabled={isPending} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" />Approve</button>
                  <button type="button" onClick={() => handleReview(request.id, "DECLINED")} disabled={isPending} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><X className="h-4 w-4" />Decline</button>
                </>}
                {request.status === "APPROVED" && <button type="button" onClick={() => handleDelete(request.id)} disabled={isPending} aria-label={`Remove ${request.name ?? "tester"} and their contact details`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>}
              </div>
            </article>
          ))}
        </div>}
      </section>
    </div>
  );
}
