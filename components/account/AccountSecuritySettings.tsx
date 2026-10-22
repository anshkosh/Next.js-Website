"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/components/useHydrated";
import PasswordField from "@/components/auth/PasswordField";

const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-coral-600";
const buttonClass = "min-h-11 rounded-xl border border-gray-300 bg-white px-4 font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60";

export default function AccountSecuritySettings({ email, emailVerified, hasPassword }: { email: string; emailVerified: boolean; hasPassword: boolean }) {
  const hydrated = useHydrated();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [sessionsStatus, setSessionsStatus] = useState("");
  const [sessionsError, setSessionsError] = useState("");
  async function changeEmail(event: React.FormEvent) {
    event.preventDefault(); setBusy("email"); setEmailError(""); setEmailStatus("");
    try {
      const result = await authClient.changeEmail({ newEmail: newEmail.trim(), callbackURL: "/settings" });
      if (result.error) setEmailError(result.error.message || "Sign in again and retry the email change.");
      else { setEmailStatus(emailVerified ? "Check your current email to confirm the request. Then verify the new address. Your sign-in email changes after both steps." : "Check your new email address for its verification link."); setNewEmail(""); }
    } catch { setEmailError("We could not confirm the email request. Please try again."); }
    finally { setBusy(""); }
  }
  async function changePassword(event: React.FormEvent) {
    event.preventDefault(); setPasswordError(""); setPasswordStatus("");
    if (newPassword !== confirmation) { setPasswordError("The new passwords do not match."); return; }
    setBusy("password");
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (result.error) setPasswordError(result.error.message || "Check your current password and try again.");
      else { setPasswordStatus("Password updated. Your other sessions have been signed out."); setCurrentPassword(""); setNewPassword(""); setConfirmation(""); }
    } catch { setPasswordError("We could not confirm the password change. Please try again."); }
    finally { setBusy(""); }
  }
  async function resendVerification() {
    setBusy("verify"); setEmailError(""); setEmailStatus("");
    try {
      const result = await authClient.sendVerificationEmail({ email, callbackURL: "/settings" });
      if (result.error) setEmailError(result.error.message || "Verification email could not be sent.");
      else setEmailStatus("Check your email for a verification link.");
    } catch { setEmailError("Verification email could not be sent. Please try again."); }
    finally { setBusy(""); }
  }
  async function revokeSessions() {
    setBusy("sessions"); setSessionsError(""); setSessionsStatus("");
    try {
      const result = await authClient.revokeOtherSessions();
      if (result.error) setSessionsError(result.error.message || "Please sign in again and retry.");
      else setSessionsStatus("Other sessions signed out. This device stays signed in.");
    } catch { setSessionsError("We could not confirm the sign-out. Please try again."); }
    finally { setBusy(""); }
  }
  return <section aria-labelledby="security-heading" className="space-y-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
    <h2 id="security-heading" className="font-heading text-2xl font-bold text-gray-900">Sign-in and security</h2>
    <div id="change-password" className="scroll-mt-6">
    {hasPassword ? <form method="post" onSubmit={changePassword} className="space-y-4">
      <fieldset disabled={!hydrated || !!busy} className="space-y-4">
        <legend className="mb-2 font-semibold text-gray-800">Change password</legend>
        <div><label htmlFor="current-password" className="text-sm font-semibold text-gray-800">Current password</label><PasswordField id="current-password" name="currentPassword" label="Current password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="new-password" className="text-sm font-semibold text-gray-800">New password</label><PasswordField id="new-password" name="newPassword" label="New password" autoComplete="new-password" required minLength={8} maxLength={128} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} /></div>
          <div><label htmlFor="confirm-password" className="text-sm font-semibold text-gray-800">Confirm new password</label><PasswordField id="confirm-password" name="confirmation" label="Confirm new password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} className={inputClass} /></div>
        </div>
        <p className="text-sm text-gray-600">Use at least 8 characters. Changing your password signs out your other sessions.</p>
        <button className={buttonClass}>{busy === "password" ? "Updating…" : "Update password"}</button>
      </fieldset>
      {passwordError && <p role="alert" className="text-sm text-red-700">{passwordError}</p>}<p role="status" className="text-sm text-green-800">{passwordStatus}</p>
    </form> : <div className="space-y-3"><h3 className="font-semibold text-gray-800">Set an email sign-in password</h3><p className="text-sm leading-relaxed text-gray-600">You sign in with Google. Request a password-recovery email to set a password for email sign-in.</p><Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-semibold text-coral-700 underline underline-offset-4">Set password by email</Link></div>}
    <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-semibold text-coral-700 underline underline-offset-4">Reset a forgotten password</Link>
    </div>
    <form id="email-address" method="post" onSubmit={changeEmail} className="scroll-mt-6 space-y-4 border-t border-gray-200 pt-6">
      <fieldset disabled={!hydrated || !!busy} className="space-y-4">
        <legend className="mb-2 font-semibold text-gray-800">Email address</legend>
        <p className="break-all text-sm text-gray-700">{email} <span className="ml-2 text-xs text-gray-600">{emailVerified ? "Verified" : "Not verified"}</span></p>
        {!emailVerified && <button type="button" onClick={resendVerification} className={buttonClass}>{busy === "verify" ? "Sending…" : "Resend verification email"}</button>}
        <div><label htmlFor="new-email" className="text-sm font-semibold text-gray-800">New email address</label><input id="new-email" name="newEmail" autoComplete="email" type="email" required maxLength={254} value={newEmail} onChange={e => { setNewEmail(e.target.value); setEmailError(""); setEmailStatus(""); }} className={inputClass} /></div>
        <p className="text-sm text-gray-600">{emailVerified ? "Confirm the change from your current email, then verify your new address." : "Your new address will need email verification."}</p>
        <button className={buttonClass}>{busy === "email" ? "Sending…" : "Change email"}</button>
      </fieldset>
      {emailError && <p role="alert" className="text-sm text-red-700">{emailError}</p>}<p role="status" className="text-sm text-green-800">{emailStatus}</p>
    </form>
    <div id="other-devices" className="scroll-mt-6 space-y-3 border-t border-gray-200 pt-6">
      <h3 className="font-semibold text-gray-800">Other devices</h3><p className="text-sm text-gray-600">End your other signed-in sessions while keeping this device connected.</p>
      <button type="button" disabled={!hydrated || !!busy} onClick={revokeSessions} className={buttonClass}>{busy === "sessions" ? "Signing out…" : "Sign out other sessions"}</button>
      {sessionsError && <p role="alert" className="text-sm text-red-700">{sessionsError}</p>}<p role="status" className="text-sm text-green-800">{sessionsStatus}</p>
    </div>
  </section>;
}
