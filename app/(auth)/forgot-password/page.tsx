"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2, Mail } from "lucide-react";
import AuthHomeIcon from "@/components/auth/AuthHomeIcon";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (requestError) setError(requestError.message || "Unable to send reset email");
      else setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
        <AuthHomeIcon />
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900 font-heading">Reset your password</h1>
        {sent ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-gray-600">If an account exists for that email, we&apos;ve sent a password reset link.</p>
            <Link href="/login" className="inline-flex font-medium text-coral-600 hover:text-coral-500">Return to login</Link>
          </div>
        ) : (
          <form method="post" onSubmit={submit} className="mt-6 space-y-5">
            <p className="text-sm text-gray-600">Enter your email and we&apos;ll send a secure reset link.</p>
            {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">{error}</p>}
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-500" aria-hidden="true" />
                <input id="forgot-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 pl-10 text-sm focus:border-coral-500 focus:outline-none focus:ring-coral-500" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send reset link
            </button>
            <p className="text-center text-sm"><Link href="/login" className="font-medium text-coral-600 hover:text-coral-500">Back to login</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
