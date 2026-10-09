"use client";

import { useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import TurnstileWidget from "@/components/startup/TurnstileWidget";
import { CONTACT_RESPONSE_TARGET } from "@/lib/contact-copy";
import { submitContactForm } from "@/app/actions/contact.actions";
import {
  CONTACT_SUBJECTS,
  type ContactSubject,
} from "@/lib/validators/contact.schema";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  subject: ContactSubject | "";
  message: string;
  token: string;
}

// ── Left Panel — decorative contact info ──────────────────────────────────────

function LeftPanel() {
  return (
    <div className="flex h-full flex-col justify-between bg-coral-700 p-6 sm:p-8">
      {/* Content */}
      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-300" aria-hidden="true" />
          <span className="text-white text-xs font-semibold tracking-wide">
            Contact the team
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white leading-tight mb-4">
          We read every
          <br />
          message.
        </h2>
        <p className="text-white/90 text-base leading-relaxed max-w-sm">
          Whether you have a question, a partnership idea, or just want to say
          hello — drop us a line. {CONTACT_RESPONSE_TARGET}
        </p>
      </div>

      {/* Contact cards */}
      <div className="mt-8 space-y-3">
        <a
          href="mailto:hello@anshkosh.com"
          className="group flex items-center gap-3 rounded-xl border border-white/25 px-4 py-3 transition-colors hover:bg-white/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <Mail className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-white/90 text-xs font-medium mb-0.5">Email us</p>
            <p className="text-white text-sm font-semibold">
              hello@anshkosh.com
            </p>
          </div>
        </a>

        <a
          href="https://twitter.com/anshkosh"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-white/25 px-4 py-3 transition-colors hover:bg-white/10"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            {/* X (Twitter) icon — inline SVG since lucide removed it */}
            <svg
              className="w-5 h-5 text-white fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <div>
            <p className="text-white/90 text-xs font-medium mb-0.5">
              Follow us
            </p>
            <p className="text-white text-sm font-semibold">@anshkosh</p>
          </div>
        </a>

        <div className="flex items-center gap-3 rounded-xl border border-white/25 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <MapPin className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-white/90 text-xs font-medium mb-0.5">Based in</p>
            <p className="text-white text-sm font-semibold">
              Hyderabad, India 🇮🇳
            </p>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <p className="mt-6 text-xs leading-relaxed text-white/90">
        {CONTACT_RESPONSE_TARGET}
      </p>
    </div>
  );
}

// ── Subject chip selector ──────────────────────────────────────────────────────

function SubjectChips({
  value,
  onChange,
}: {
  value: ContactSubject | "";
  onChange: (v: ContactSubject) => void;
}) {
  return (
    <div role="radiogroup" aria-labelledby="contact-subject-label" className="flex flex-wrap gap-2">
      {CONTACT_SUBJECTS.map((s) => (
        <label key={s} className="relative cursor-pointer">
          <input
            type="radio"
            name="contact-subject"
            value={s}
            checked={value === s}
            aria-label={`Subject: ${s}`}
            onChange={() => onChange(s)}
            className="peer sr-only"
          />
          <span className="inline-flex min-h-11 items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-coral-300 hover:text-coral-700 peer-checked:border-coral-600 peer-checked:bg-coral-600 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral-700">
            {s}
          </span>
        </label>
      ))}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-coral-600 focus:border-transparent transition-colors";

// ── Success state ─────────────────────────────────────────────────────────────

function SuccessState({
  name,
  onReset,
}: {
  name: string;
  onReset: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6 gap-5"
    >
      <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <div>
        <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
          Message received!
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
          Thanks, <strong className="text-gray-700">{name}</strong>! We&apos;ve
          sent a confirmation to your inbox. {CONTACT_RESPONSE_TARGET}
        </p>
      </div>
      <button
        onClick={onReset}
        className="mt-2 text-sm text-coral-500 hover:text-coral-600 hover:underline font-medium transition-colors"
      >
        Send another message
      </button>
    </motion.div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function ContactContent({ initialSubject = "" }: { initialSubject?: ContactSubject | "" }) {
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: initialSubject,
    message: "",
    token: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleToken = useCallback(
    (token: string) => setForm((prev) => ({ ...prev, token })),
    [],
  );
  const handleExpire = useCallback(
    () => setForm((prev) => ({ ...prev, token: "" })),
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!form.subject) {
      setError("Please select a subject.");
      return;
    }
    if (!form.token) {
      setError("Please complete the CAPTCHA challenge.");
      return;
    }

    startTransition(async () => {
      const result = await submitContactForm({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject as ContactSubject,
        message: form.message.trim(),
        turnstileToken: form.token,
      });

      if (result.error) {
        setError(result.error);
        setForm((prev) => ({ ...prev, token: "" }));
      } else {
        setSuccess(true);
      }
    });
  };

  const handleReset = () => {
    setForm({ name: "", email: "", subject: initialSubject, message: "", token: "" });
    setError(null);
    setSuccess(false);
  };

  const isSubmitDisabled = isPending || !form.token || !form.subject;

  return (
    <div className="page-intro-spacing min-h-screen bg-gray-50/50 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page heading */}
        <div className="mb-10 text-center">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-coral-50 border border-coral-100 text-coral-600 text-xs font-semibold uppercase tracking-widest">
            Get in touch
          </span>
          <h1 className="page-title">
            Contact Us
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">
            Questions, ideas, or feedback — we&apos;d love to hear from you.
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft lg:grid-cols-5"
        >
          {/* Left decorative panel — 2/5 */}
          <div className="order-2 lg:order-1 lg:col-span-2">
            <LeftPanel />
          </div>

          {/* Right form panel — 3/5 */}
          <div className="order-1 p-6 sm:p-8 lg:order-2 lg:col-span-3">
            <AnimatePresence mode="wait">
              {success ? (
                <SuccessState
                  key="success"
                  name={form.name || "there"}
                  onReset={handleReset}
                />
              ) : (
                <motion.form
                  key="form"
                  initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  noValidate
                >
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-gray-900 mb-1">
                      Send us a message
                    </h2>
                    <p className="text-sm text-gray-500">
                      All fields marked{" "}
                      <span className="text-coral-500">*</span> are required.
                    </p>
                  </div>

                  {/* Subject chips */}
                  <div>
                    <p id="contact-subject-label" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-coral-500">*</span>
                    </p>
                    <SubjectChips
                      value={form.subject}
                      onChange={(v) => setField("subject", v)}
                    />
                  </div>

                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Name <span className="text-coral-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        maxLength={100}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Email <span className="text-coral-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        maxLength={254}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Message <span className="text-coral-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      placeholder="Tell us what's on your mind… (min. 20 characters)"
                      value={form.message}
                      onChange={(e) => setField("message", e.target.value)}
                      maxLength={2000}
                      required
                      className={`${inputClass} resize-none`}
                    />
                    <div className="flex justify-end mt-1">
                      <span
                        className={`text-xs tabular-nums ${
                          form.message.length > 1800
                            ? "text-coral-500"
                            : "text-gray-500"
                        }`}
                      >
                        {form.message.length}/2000
                      </span>
                    </div>
                  </div>

                  {/* Turnstile */}
                  <TurnstileWidget
                    onToken={handleToken}
                    onExpire={handleExpire}
                  />

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        role="alert"
                        className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-coral-700 active:bg-coral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Protected by Cloudflare Turnstile · No spam, ever.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
