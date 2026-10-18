"use client";

import { FormEvent, useState, useTransition } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { subscribeToNewsletter } from "@/app/actions/newsletter.actions";
import TurnstileWidget from "@/components/startup/TurnstileWidget";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [challengeKey, setChallengeKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await subscribeToNewsletter({ email, consent, token });
      setToken(""); setChallengeKey(key => key + 1);
      if (result.error) setMessage(result.error);
      else {
        setSuccess(true);
        setEmail("");
      }
    });
  };

  if (success) return <p role="status" className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400"><CheckCircle2 size={16} aria-hidden="true" /> Check your inbox to confirm. You are not subscribed until you confirm.</p>;

  return (
    <div className="max-w-sm">
      <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Get the next signal</p>
      <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">Occasional founder stories and pilot updates. No noise.</p>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Your email is used to send these updates. Unsubscribe any time. See our <Link href="/privacy" className="underline underline-offset-2">Privacy Notice</Link>.</p>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <label htmlFor="newsletter-email" className="sr-only">Email for newsletter</label>
        <div className="relative min-w-0 flex-1"><Mail size={15} className="pointer-events-none absolute left-3 top-3.5 text-gray-400" aria-hidden="true" /><input id="newsletter-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-11 w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-coral-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /></div>
        <button type="submit" disabled={isPending} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-coral-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-700 disabled:opacity-60">{isPending && <Loader2 size={14} className="animate-spin" />}Join</button>
        <label className="flex w-full items-start gap-2 text-xs text-gray-700"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /> I want occasional Anshkosh founder stories and pilot updates by email. I can unsubscribe at any time.</label>
        {consent && <TurnstileWidget key={challengeKey} onToken={setToken} onExpire={() => setToken("")} />}
      </form>
      {message && <p role="alert" className="mt-2 text-xs text-red-600">{message}</p>}
    </div>
  );
}
