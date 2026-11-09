"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import AdminAuthShell from "@/components/admin/AdminAuthShell";

const inputClass = "appearance-none block w-full px-3 py-2.5 border border-gray-600 rounded-lg shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base tracking-widest transition-colors";
const buttonClass = "w-full flex justify-center items-center gap-2 min-h-11 py-2.5 px-4 rounded-lg shadow-lg shadow-indigo-900/50 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-gray-900 disabled:opacity-70 transition-colors";

export default function AdminTwoFactorPage() {
  return <Suspense fallback={<p role="status" className="p-8">Loading…</p>}><AdminTwoFactorForm /></Suspense>;
}

function AdminTwoFactorForm() {
  const router = useRouter();
  const reauth = useSearchParams().get("reason") === "reauth";
  const [useBackup, setUseBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (reauth) {
    const signInAgain = async () => {
      setLoading(true);
      try { await authClient.signOut(); } finally { router.replace("/admin/login"); }
    };
    return (
      <AdminAuthShell title="Confirm it's you" subtitle="Admin access needs your password and authenticator code">
        <p className="text-sm text-gray-300">
          This account uses two-factor authentication. Sessions started with Google, or before two-factor was turned on, cannot open the admin panel. Sign in again with your email, password and authenticator code.
        </p>
        <button type="button" onClick={signInAgain} disabled={loading} className={`${buttonClass} mt-6`}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          Sign in again
        </button>
      </AdminAuthShell>
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    setLoading(true);
    setError("");
    try {
      const result = useBackup
        ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice: false })
        : await authClient.twoFactor.verifyTotp({ code: code.replace(/\s+/g, ""), trustDevice: false });
      if (result.error) {
        setError(result.error.message || "That code did not work. Try again.");
        return;
      }
      const role = (result.data?.user as { role?: string | null } | undefined)?.role;
      router.push(role === "admin" || role === "reviewer" ? "/admin/dashboard" : "/dashboard");
      router.refresh();
    } catch {
      setError("We could not check that code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthShell title="Two-factor check" subtitle={useBackup ? "Enter one of your saved backup codes" : "Enter the 6-digit code from Google Authenticator"}>
      <form method="post" className="space-y-5" onSubmit={submit}>
        {error && (
          <div role="alert" className="bg-red-900/50 border border-red-800 text-red-200 text-sm p-3 rounded-lg text-center">
            {error}{" "}
            {/expired|invalid two factor cookie|request a new code/i.test(error) && <Link href="/admin/login" className="underline">Start again</Link>}
          </div>
        )}
        <div>
          <label htmlFor="two-factor-code" className="block text-sm font-medium text-gray-300">
            {useBackup ? "Backup code" : "Authenticator code"}
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound className="h-5 w-5 text-gray-500" aria-hidden="true" />
            </div>
            <input
              key={useBackup ? "backup" : "totp"}
              id="two-factor-code"
              name="code"
              required
              autoFocus
              autoComplete="one-time-code"
              inputMode={useBackup ? "text" : "numeric"}
              pattern={useBackup ? undefined : "[0-9 ]{6,7}"}
              maxLength={useBackup ? 32 : 7}
              placeholder={useBackup ? "xxxxx-xxxxx" : "123456"}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          Verify
        </button>
      </form>
      <div className="mt-6 border-t border-gray-700 pt-6 flex flex-col gap-3 text-center">
        <button type="button" onClick={() => { setUseBackup(value => !value); setError(""); }} className="min-h-11 text-sm font-medium text-indigo-300 hover:text-white transition-colors">
          {useBackup ? "Use authenticator code instead" : "Lost your phone? Use a backup code"}
        </button>
        <Link href="/admin/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">← Back to admin sign-in</Link>
      </div>
    </AdminAuthShell>
  );
}
