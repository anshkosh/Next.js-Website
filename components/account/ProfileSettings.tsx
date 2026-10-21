"use client";

import { useHydrated } from "@/components/useHydrated";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { saveProfileSettings } from "@/app/actions/profile.actions";
import FounderModeToggle from "./FounderModeToggle";

export default function ProfileSettings({
  user,
}: {
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
    founderMode: boolean;
  };
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [founderMode, setFounderMode] = useState(user.founderMode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await saveProfileSettings({ name, founderMode });
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Profile saved.");
      // A failed session refresh cannot turn a committed save into a failure.
      try {
        await authClient.getSession({ query: { disableCookieCache: true } });
      } catch {
        /* Next navigation refreshes the session. */
      }
      router.refresh();
    } catch {
      setError(
        "We could not confirm the save. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form method="post" onSubmit={save} className="space-y-6">
      <fieldset
        disabled={!hydrated || busy}
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <legend className="sr-only">Account profile</legend>
        <div>
          <label
            htmlFor="profile-name"
            className="block text-sm font-semibold text-gray-800"
          >
            Full name
          </label>
          <input
            id="profile-name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setMessage("");
            }}
            className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 focus:outline-coral-600"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">Email address</p>
          <p className="mt-2 break-all text-gray-600">{user.email}</p>
          <p className="mt-1 text-xs text-gray-500">
            {user.emailVerified
              ? "Email verified"
              : "Verify your email to submit a startup."}
          </p>
        </div>
        <div className="border-t border-gray-100 pt-6">
          <FounderModeToggle
            checked={founderMode}
            onChange={(value) => {
              setFounderMode(value);
              setMessage("");
            }}
          />
          <p
            id="founder-mode-help"
            className="mt-3 text-sm leading-relaxed text-gray-600"
          >
            Turn on startup submissions, your founder journal and launch
            workspace. Leave it off to explore as a member or backer. You can
            switch anytime; existing startups and journal entries stay saved.
          </p>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <p role="status" className="text-sm text-green-800">
        {message}
      </p>
      <div className="flex flex-wrap items-center gap-5">
        <button
          disabled={!hydrated || busy}
          className="min-h-11 rounded-xl bg-coral-600 px-5 font-semibold text-white hover:bg-coral-700 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-gray-700 underline underline-offset-4"
        >
          Back to dashboard
        </Link>
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 items-center text-sm text-gray-600 underline underline-offset-4"
        >
          Reset password
        </Link>
      </div>
    </form>
  );
}
