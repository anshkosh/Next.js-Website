"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { confirmNewsletter, unsubscribeNewsletter } from "@/app/actions/newsletter.actions";

export default function NewsletterConfirmation({ token, mode }: { token: string; mode: "confirm" | "unsubscribe" }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string }>({});
  return <div className="space-y-5">
    <p>{mode === "confirm" ? "Confirm that you want occasional founder stories and pilot updates from Anshkosh. You can withdraw without an account." : "Stop newsletter emails from Anshkosh. No sign-in is required."}</p>
    {!result.success && <button type="button" disabled={pending || !token} className="rounded-lg bg-gray-900 px-5 py-3 text-white disabled:opacity-50" onClick={() => start(async () => setResult(await (mode === "confirm" ? confirmNewsletter(token) : unsubscribeNewsletter(token))))}>{pending ? "Saving…" : mode === "confirm" ? "Confirm newsletter signup" : "Unsubscribe"}</button>}
    {result.error && <p role="alert">{result.error}</p>}
    {result.success && <p role="status">{mode === "confirm" ? "Your subscription is confirmed." : "You are unsubscribed."}</p>}
    {mode === "confirm" && result.success && <Link href={`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`} className="block underline">Withdraw newsletter consent</Link>}
    <Link href="/privacy" className="block underline">Privacy Notice</Link>
  </div>;
}
