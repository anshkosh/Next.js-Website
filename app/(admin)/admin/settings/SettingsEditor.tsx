"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { updateSetting } from "@/app/actions/settings.actions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function parseEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export default function SettingsEditor({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error', text: string }>>({});

  // ── Contact email tags state ──────────────────────────────────────────────
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  const contactEmails = parseEmails(settings.contact_notification_emails || "");

  const addEmail = (raw: string) => {
    const email = raw.trim().toLowerCase().replace(/,$/, "");
    if (!email) return;
    if (!isValidEmail(email)) {
      setEmailError("Invalid email address.");
      return;
    }
    if (contactEmails.includes(email)) {
      setEmailError("Already added.");
      return;
    }
    setEmailError("");
    const updated = [...contactEmails, email].join(",");
    setSettings((prev) => ({ ...prev, contact_notification_emails: updated }));
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    const updated = contactEmails.filter((e) => e !== email).join(",");
    setSettings((prev) => ({ ...prev, contact_notification_emails: updated }));
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(emailInput);
    } else if (e.key === "Backspace" && !emailInput && contactEmails.length > 0) {
      removeEmail(contactEmails[contactEmails.length - 1]);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setIsSaving(prev => ({ ...prev, [key]: true }));
    setMessages(prev => ({ ...prev, [key]: { type: 'success', text: '' } }));

    // Validation
    if (key === 'upvote_milestones') {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed) || !parsed.every(n => typeof n === 'number')) {
          setMessages(prev => ({ ...prev, [key]: { type: 'error', text: 'Must be a valid JSON array of numbers.' } }));
          setIsSaving(prev => ({ ...prev, [key]: false }));
          return;
        }
      } catch {
        setMessages(prev => ({ ...prev, [key]: { type: 'error', text: 'Invalid JSON format.' } }));
        setIsSaving(prev => ({ ...prev, [key]: false }));
        return;
      }
    }

    if (key === 'max_startups_per_user') {
      const num = parseInt(value, 10);
      if (!Number.isInteger(num) || num < 1) {
        setMessages(prev => ({ ...prev, [key]: { type: 'error', text: 'Must be a whole number of at least 1.' } }));
        setIsSaving(prev => ({ ...prev, [key]: false }));
        return;
      }
    }

    const res = await updateSetting(key, value);
    
    if (res.error) {
      setMessages(prev => ({ ...prev, [key]: { type: 'error', text: res.error || "Error" } }));
    } else {
      setMessages(prev => ({ ...prev, [key]: { type: 'success', text: 'Saved successfully!' } }));
      setTimeout(() => setMessages(prev => {
        const newM = { ...prev };
        delete newM[key];
        return newM;
      }), 3000);
    }
    
    setIsSaving(prev => ({ ...prev, [key]: false }));
  };

  return (
    <div className="space-y-8">
      {/* Maintenance Mode */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Maintenance Mode</h3>
            <p className="text-sm text-gray-500">Enable to show a maintenance page to all non-admin users.</p>
          </div>
          <button
            onClick={() => handleSave("maintenance_mode", settings.maintenance_mode === "true" ? "false" : "true")}
            disabled={isSaving["maintenance_mode"]}
            className="px-4 py-2 bg-coral-600 text-white rounded-md font-medium hover:bg-coral-700 disabled:opacity-50"
          >
            {isSaving["maintenance_mode"] ? "Saving..." : "Toggle & Save"}
          </button>
        </div>
        
        <div className="flex items-center gap-3 mt-4">
          <div 
            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.maintenance_mode === "true" ? "bg-red-500" : "bg-gray-300"}`}
            onClick={() => setSettings(prev => ({ ...prev, maintenance_mode: prev.maintenance_mode === "true" ? "false" : "true" }))}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${settings.maintenance_mode === "true" ? "translate-x-6" : ""}`}></div>
          </div>
          <span className="font-medium text-gray-700">
            {settings.maintenance_mode === "true" ? "Enabled (Site is down)" : "Disabled (Site is live)"}
          </span>
        </div>
        
        {messages["maintenance_mode"] && (
          <p className={`mt-2 text-sm ${messages["maintenance_mode"].type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {messages["maintenance_mode"].text}
          </p>
        )}
      </div>

      {/* Max Startups Per User */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Max Startups Per User</h3>
            <p className="text-sm text-gray-500">
              Maximum number of startups a single user can create. Minimum is 1.
            </p>
          </div>
          <button
            onClick={() => handleSave("max_startups_per_user", settings.max_startups_per_user)}
            disabled={isSaving["max_startups_per_user"]}
            className="px-4 py-2 bg-coral-600 text-white rounded-md font-medium hover:bg-coral-700 disabled:opacity-50"
          >
            {isSaving["max_startups_per_user"] ? "Saving..." : "Save"}
          </button>
        </div>

        <input
          type="number"
          min={1}
          max={100}
          value={settings.max_startups_per_user}
          onChange={(e) => {
            // Prevent 0 or negative
            const val = Math.max(1, parseInt(e.target.value, 10) || 1).toString();
            setSettings(prev => ({ ...prev, max_startups_per_user: val }));
          }}
          className="w-32 border border-gray-300 rounded-md p-2 text-sm font-mono focus:ring-coral-500 focus:border-coral-500 outline-none bg-gray-50"
        />

        {messages["max_startups_per_user"] && (
          <p className={`mt-2 text-sm ${messages["max_startups_per_user"].type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {messages["max_startups_per_user"].text}
          </p>
        )}
      </div>

      {/* Upvote Milestones */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Upvote Milestones</h3>
            <p className="text-sm text-gray-500">Define the upvote counts at which founders receive congratulatory emails. Must be a JSON array of numbers.</p>
          </div>
          <button
            onClick={() => handleSave("upvote_milestones", settings.upvote_milestones)}
            disabled={isSaving["upvote_milestones"]}
            className="px-4 py-2 bg-coral-600 text-white rounded-md font-medium hover:bg-coral-700 disabled:opacity-50"
          >
            {isSaving["upvote_milestones"] ? "Saving..." : "Save JSON"}
          </button>
        </div>
        
        <textarea
          value={settings.upvote_milestones}
          onChange={(e) => setSettings(prev => ({ ...prev, upvote_milestones: e.target.value }))}
          className="w-full h-32 border border-gray-300 rounded-md p-3 font-mono text-sm focus:ring-coral-500 focus:border-coral-500 outline-none bg-gray-50"
        ></textarea>
        
        {messages["upvote_milestones"] && (
          <p className={`mt-2 text-sm ${messages["upvote_milestones"].type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {messages["upvote_milestones"].text}
          </p>
        )}
      </div>

      {/* Contact Notification Emails */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold">Contact Notification Emails</h3>
            <p className="text-sm text-gray-500">
              Emails that receive a notification when the Contact Us form is submitted.
              Falls back to <code className="bg-gray-100 px-1 rounded text-xs">EMAIL_FROM</code> env var if empty.
            </p>
          </div>
          <button
            onClick={() => handleSave("contact_notification_emails", settings.contact_notification_emails || "")}
            disabled={isSaving["contact_notification_emails"]}
            className="px-4 py-2 bg-coral-600 text-white rounded-md font-medium hover:bg-coral-700 disabled:opacity-50 whitespace-nowrap"
          >
            {isSaving["contact_notification_emails"] ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Tag input area */}
        <div
          className="min-h-[48px] w-full flex flex-wrap gap-2 items-center border border-gray-300 rounded-md px-3 py-2 bg-gray-50 cursor-text focus-within:ring-2 focus-within:ring-coral-400 focus-within:border-coral-400 transition-[border-color,box-shadow]"
          onClick={() => emailInputRef.current?.focus()}
        >
          {/* Existing email pills */}
          {contactEmails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1.5 bg-coral-50 border border-coral-200 text-coral-700 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {email}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeEmail(email); }}
                className="text-coral-400 hover:text-coral-600 transition-colors"
                aria-label={`Remove ${email}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Text input */}
          <input
            ref={emailInputRef}
            type="email"
            value={emailInput}
            onChange={(e) => { setEmailInput(e.target.value); setEmailError(""); }}
            onKeyDown={handleEmailKeyDown}
            onBlur={() => { if (emailInput.trim()) addEmail(emailInput); }}
            placeholder={contactEmails.length === 0 ? "Type email and press Enter or comma..." : "Add another..."}
            className="flex-1 min-w-[200px] bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none border-none p-0"
          />

          {/* Inline add button */}
          {emailInput.trim() && (
            <button
              type="button"
              onClick={() => addEmail(emailInput)}
              className="flex items-center gap-1 text-xs text-coral-600 hover:text-coral-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

        {/* Hint */}
        <p className="mt-1.5 text-xs text-gray-500">
          Press <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 text-[10px] font-mono">Enter</kbd> or{" "}
          <kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 text-[10px] font-mono">,</kbd> to add.
          Backspace removes the last tag.
        </p>

        {/* Validation error */}
        {emailError && (
          <p className="mt-1 text-sm text-red-500">{emailError}</p>
        )}

        {/* Save feedback */}
        {messages["contact_notification_emails"] && (
          <p className={`mt-2 text-sm ${messages["contact_notification_emails"].type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {messages["contact_notification_emails"].text}
          </p>
        )}
      </div>
    </div>
  );
}
