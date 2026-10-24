"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, UsersRound } from "lucide-react";
import { submitBetaTesterRequest } from "@/app/actions/beta-tester.actions";
import TurnstileWidget from "./TurnstileWidget";

export default function BetaTesterSignup({
  startupId,
  startupName,
  description,
  reward,
}: {
  startupId: string;
  startupName: string;
  description: string;
  reward: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [turnstileToken, setTurnstileToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [consent, setConsent] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setNotice(null);

    const submittedToken = turnstileToken;
    startTransition(async () => {
      try {
        const result = await submitBetaTesterRequest({
          startupId,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          message: String(form.get("message") ?? ""),
          consent,
          adultConfirmed,
          turnstileToken: submittedToken,
        });
        if (result.error) {
          setNotice({ type: "error", text: result.error });
        } else {
          setNotice({ type: "success", text: `Your interest has been sent to ${startupName}’s founder. If approved, they’ll contact you directly.` });
          formElement.reset();
          setConsent(false);
          setAdultConfirmed(false);
        }
      } catch {
        setNotice({ type: "error", text: "We couldn’t confirm your request. Your entries are still here; please try again." });
      } finally {
        // Turnstile tokens are single-use, including when later server work fails.
        setTurnstileToken("");
        setCaptchaAttempt(attempt => attempt + 1);
      }
    });
  };

  return (
    <section aria-labelledby="beta-tester-title" className="overflow-hidden rounded-3xl border border-coral-200 bg-white shadow-sm">
      <div className="border-b border-coral-100 bg-gradient-to-r from-coral-50 via-white to-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-coral-700">
            <UsersRound aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral-700">Help shape what’s next</p>
            <h2 id="beta-tester-title" className="mt-1 font-heading text-2xl font-bold text-gray-900">Become a beta tester</h2>
            <p className="mt-2 max-w-2xl whitespace-pre-wrap leading-relaxed text-gray-600">{description}</p>
            {reward && <p className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-900"><span className="font-semibold">What the founder is offering:</span> {reward}</p>}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
        {notice && <p role={notice.type === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{notice.type === "success" && <CheckCircle2 aria-hidden="true" className="mr-2 inline h-4 w-4" />}{notice.text}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-gray-800">Your name
            <input name="name" autoComplete="name" maxLength={80} required className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 px-3 font-normal focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-100" />
          </label>
          <label className="block text-sm font-semibold text-gray-800">Email address
            <input name="email" type="email" autoComplete="email" maxLength={254} required className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-300 px-3 font-normal focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-100" />
          </label>
        </div>
        <label className="block text-sm font-semibold text-gray-800">What would you like to try? <span className="font-normal text-gray-500">(optional)</span>
          <textarea name="message" rows={3} maxLength={500} className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2 font-normal focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-100" />
        </label>

        <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
          <input type="checkbox" required checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-coral-600 focus:ring-coral-500" />
          <span>I confirm I’m 18 or older.</span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
          <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-coral-600 focus:ring-coral-500" />
          <span>I agree that Anshkosh may share my name and optional note with {startupName}’s founder to review this request. If approved, Anshkosh may share my email address with the founder so they can contact me. See the <Link className="font-semibold text-coral-700 underline underline-offset-2" href="/beta-consent">Beta Tester Consent Notice</Link> and <Link className="font-semibold text-coral-700 underline underline-offset-2" href="/privacy">Privacy Notice</Link>.</span>
        </label>

        <div>
        <TurnstileWidget key={captchaAttempt} onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
        </div>
        <p className="text-xs leading-relaxed text-gray-500">The founder decides whom to accept and provides any product access, onboarding, support, and reward directly. A request does not guarantee selection or access. Please don’t include sensitive information.</p>
        <button type="submit" disabled={isPending || !turnstileToken || !consent || !adultConfirmed} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-coral-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
          {isPending ? "Sending request…" : "Ask to join the beta"}<ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
