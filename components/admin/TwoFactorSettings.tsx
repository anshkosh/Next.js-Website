"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import PasswordField from "@/components/auth/PasswordField";
import { useHydrated } from "@/components/useHydrated";
import TotpQrCode from "./TotpQrCode";

type Tone = "dark" | "light";
type Step = "idle" | "scan" | "codes";

const styles = {
  dark: {
    text: "text-gray-300", muted: "text-gray-400", heading: "text-white",
    input: "appearance-none block w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm",
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white",
    secondary: "border border-gray-600 text-gray-200 hover:bg-gray-700",
    panel: "border border-gray-700 bg-gray-900/60",
    error: "bg-red-900/50 border border-red-800 text-red-200",
    ok: "bg-emerald-900/40 border border-emerald-800 text-emerald-200",
  },
  light: {
    text: "text-gray-700", muted: "text-gray-500", heading: "text-gray-900",
    input: "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-coral-600",
    primary: "bg-gray-900 hover:bg-gray-800 text-white",
    secondary: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
    panel: "border border-gray-200 bg-gray-50",
    error: "bg-red-50 border border-red-200 text-red-800",
    ok: "bg-emerald-50 border border-emerald-200 text-emerald-800",
  },
} as const;

function secretFromUri(uri: string) {
  try { return new URL(uri).searchParams.get("secret") ?? ""; } catch { return ""; }
}

export default function TwoFactorSettings({ role, enabled, hasPassword, tone = "light", doneHref }: {
  role: string;
  enabled: boolean;
  hasPassword: boolean;
  tone?: Tone;
  /** Where to go after first-time setup finishes. Omit to stay and refresh. */
  doneHref?: string;
}) {
  const router = useRouter();
  // Submitting before the handlers are attached would post the form natively and do nothing.
  const hydrated = useHydrated();
  const s = styles[tone];
  const [step, setStep] = useState<Step>("idle");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const isAdmin = role === "admin";
  const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:opacity-60 transition-colors";

  function reset() { setError(""); setStatus(""); }

  async function begin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); reset();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy("enable");
    try {
      const result = await authClient.twoFactor.enable({ password, issuer: "Anshkosh" });
      if (result.error || !result.data || !("totpURI" in result.data) || !result.data.totpURI) {
        setError(result.error?.message || "Check your password and try again.");
        return;
      }
      setTotpURI(result.data.totpURI);
      setBackupCodes(result.data.backupCodes ?? []);
      setStep("scan");
    } catch { setError("We could not start setup. Please try again."); }
    finally { setBusy(""); }
  }

  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); reset();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").replace(/\s+/g, "");
    setBusy("verify");
    try {
      const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (result.error) { setError(result.error.message || "That code did not match. Check the time on your phone and try again."); return; }
      // Sessions that never passed the second factor must not stay signed in.
      await authClient.revokeOtherSessions().catch(() => undefined);
      setStep("codes");
    } catch { setError("We could not check that code. Please try again."); }
    finally { setBusy(""); }
  }

  async function regenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); reset();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy("regenerate");
    try {
      const result = await authClient.twoFactor.generateBackupCodes({ password });
      if (result.error || !result.data) { setError(result.error?.message || "Check your password and try again."); return; }
      setBackupCodes(result.data.backupCodes);
      setStep("codes");
    } catch { setError("We could not create new backup codes. Please try again."); }
    finally { setBusy(""); }
  }

  async function disable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); reset();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy("disable");
    try {
      const result = await authClient.twoFactor.disable({ password });
      if (result.error) { setError(result.error.message || "Check your password and try again."); return; }
      setStatus("Two-factor authentication is off.");
      router.refresh();
    } catch { setError("We could not turn off two-factor authentication. Please try again."); }
    finally { setBusy(""); }
  }

  function finish() {
    setStep("idle"); setBackupCodes([]); setTotpURI("");
    if (doneHref) router.replace(doneHref);
    router.refresh();
  }

  function downloadCodes() {
    const blob = new Blob([`Anshkosh admin backup codes\nEach code works once.\n\n${backupCodes.join("\n")}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "anshkosh-backup-codes.txt"; link.click();
    URL.revokeObjectURL(url);
  }

  const messages = (
    <>
      {error && <p role="alert" className={`rounded-lg p-3 text-sm ${s.error}`}>{error}</p>}
      {status && <p role="status" className={`rounded-lg p-3 text-sm ${s.ok}`}>{status}</p>}
    </>
  );

  const passwordForm = (id: string, label: string, action: string, onSubmit: (event: React.FormEvent<HTMLFormElement>) => void, extra = "") => (
    <form method="post" onSubmit={onSubmit} className="space-y-3">
      <label htmlFor={id} className={`block text-sm font-medium ${s.text}`}>Current password</label>
      <PasswordField id={id} name="password" label="Current password" autoComplete="current-password" required className={s.input} />
      <button type="submit" disabled={!hydrated || !!busy} className={`${btn} ${extra || s.primary}`}>
        {busy === action && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}{label}
      </button>
    </form>
  );

  if (!hasPassword) {
    return (
      <div className={`space-y-3 text-sm ${s.text}`}>
        <p>Two-factor setup asks for your password, and this account signs in with Google only.</p>
        <p><Link href="/settings" className="font-semibold underline">Set a password in your profile settings</Link>, then come back here.</p>
      </div>
    );
  }

  if (step === "scan") {
    const secret = secretFromUri(totpURI);
    return (
      <div className="space-y-5">
        <ol className={`list-decimal space-y-1 pl-5 text-sm ${s.text}`}>
          <li>Open Google Authenticator (or another authenticator app) on your phone.</li>
          <li>Tap <strong>+</strong>, then <strong>Scan a QR code</strong>.</li>
          <li>Enter the 6-digit code it shows below.</li>
        </ol>
        <div className="flex justify-center"><TotpQrCode uri={totpURI} /></div>
        <details className={`rounded-lg p-3 text-sm ${s.panel} ${s.text}`}>
          <summary className="cursor-pointer font-medium">Can&apos;t scan? Enter this key instead</summary>
          <code className="mt-2 block break-all font-mono text-xs">{secret}</code>
        </details>
        {messages}
        <form method="post" onSubmit={confirm} className="space-y-3">
          <label htmlFor="setup-code" className={`block text-sm font-medium ${s.text}`}>6-digit code</label>
          <input id="setup-code" name="code" required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9 ]{6,7}" maxLength={7} placeholder="123456" className={`${s.input} tracking-widest`} />
          <button type="submit" disabled={!hydrated || !!busy} className={`${btn} w-full ${s.primary}`}>
            {busy === "verify" && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}Turn on two-factor
          </button>
        </form>
      </div>
    );
  }

  if (step === "codes") {
    return (
      <div className="space-y-4">
        <p className={`text-sm ${s.text}`}>
          <strong className={s.heading}>Save these backup codes now.</strong> Each one works once if you lose your phone. You won&apos;t see them again.
        </p>
        <ul className={`grid grid-cols-2 gap-2 rounded-lg p-4 font-mono text-sm ${s.panel} ${s.heading}`}>
          {backupCodes.map(code => <li key={code}>{code}</li>)}
        </ul>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigator.clipboard?.writeText(backupCodes.join("\n")).then(() => setStatus("Copied."), () => setError("Copy failed. Download the codes instead."))} className={`${btn} ${s.secondary}`}>Copy</button>
          <button type="button" onClick={downloadCodes} className={`${btn} ${s.secondary}`}>Download .txt</button>
        </div>
        {messages}
        <button type="button" onClick={finish} className={`${btn} w-full ${s.primary}`}>I&apos;ve saved my codes</button>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="space-y-4">
        <p className={`text-sm ${s.text}`}>
          {isAdmin
            ? "Two-factor authentication is required for admin accounts. Confirm your password to set up Google Authenticator."
            : "Add a 6-digit code from Google Authenticator to every admin sign-in. Confirm your password to start."}
        </p>
        {messages}
        {passwordForm("enable-password", "Set up authenticator", "enable", begin)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className={`text-sm ${s.text}`}>
        <strong className={s.heading}>Two-factor authentication is on.</strong> Every admin sign-in asks for a code from your authenticator app.
      </p>
      {messages}
      <section className="space-y-2">
        <h2 className={`text-base font-semibold ${s.heading}`}>Backup codes</h2>
        <p className={`text-sm ${s.muted}`}>Creating new codes cancels all of your old ones.</p>
        {passwordForm("regenerate-password", "Create new backup codes", "regenerate", regenerate, s.secondary)}
      </section>
      {isAdmin ? (
        <section className="space-y-1">
          <h2 className={`text-base font-semibold ${s.heading}`}>New phone?</h2>
          <p className={`text-sm ${s.muted}`}>Admins can&apos;t turn two-factor off. To move to a new phone, ask another admin to reset your two-factor from the Admins page, then set it up again at your next sign-in.</p>
        </section>
      ) : (
        <section className="space-y-2">
          <h2 className={`text-base font-semibold ${s.heading}`}>Turn off two-factor</h2>
          <p className={`text-sm ${s.muted}`}>Your admin sign-in will need only your password.</p>
          {passwordForm("disable-password", "Turn off", "disable", disable, s.secondary)}
        </section>
      )}
    </div>
  );
}
