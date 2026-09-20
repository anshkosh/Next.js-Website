"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import PasswordField from "@/components/auth/PasswordField";

export default function ResetPasswordPage() {
  const [token] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: resetError } = await authClient.resetPassword({ newPassword: password, token });
      if (resetError) setError(resetError.message || "Unable to reset password");
      else setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
        <Link href="/" className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-coral-500 text-3xl font-bold text-white" aria-label="Anshkosh home">a</Link>
        {success ? (
          <div className="space-y-4 text-center"><h1 className="text-3xl font-extrabold tracking-tight text-gray-900 font-heading">Password updated</h1><p className="text-gray-600">Your password has been changed successfully.</p><Link href="/login" className="inline-flex font-medium text-coral-600 hover:text-coral-500">Continue to login</Link></div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-gray-900 font-heading">Choose a new password</h1>
            {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">{error}</p>}
            <div><label htmlFor="reset-password" className="block text-sm font-medium text-gray-700">New password</label><PasswordField id="reset-password" name="password" label="New password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-coral-500 focus:outline-none focus:ring-coral-500" /><p className="mt-2 text-xs text-gray-500">Use at least 8 characters, including one uppercase letter and one number.</p></div>
            <button type="submit" disabled={loading || !token || password.length < 8} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70">{loading && <Loader2 size={16} className="animate-spin" />}Update password</button>
          </form>
        )}
      </div>
    </div>
  );
}
