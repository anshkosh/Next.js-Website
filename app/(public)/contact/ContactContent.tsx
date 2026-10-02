"use client";

import { useState, useTransition, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import TurnstileWidget from "@/components/startup/TurnstileWidget";
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
    <div className="relative flex flex-col justify-between bg-gradient-to-br from-coral-600 via-coral-500 to-orange-600 p-10 overflow-hidden lg:min-h-full">
      {/* Decorative circles */}
      <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-12 left-1/4 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-white text-xs font-semibold tracking-wide">
            We&apos;re online
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white leading-tight mb-4">
          We read every
          <br />
          message.
        </h2>
        <p className="text-white/70 text-base leading-relaxed max-w-xs">
          Whether you have a question, a partnership idea, or just want to say
          hello — drop us a line and we&apos;ll get back to you within 24–48
          hours.
        </p>
      </div>

      {/* Contact cards */}
      <div className="relative z-10 mt-10 space-y-3">
        <a
          href="mailto:hello@anshkosh.com"
          className="flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-4 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium mb-0.5">Email us</p>
            <p className="text-white text-sm font-semibold">
              hello@anshkosh.com
            </p>
          </div>
        </a>

        <a
          href="https://twitter.com/anshkosh"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-4 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
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
            <p className="text-white/60 text-xs font-medium mb-0.5">
              Follow us
            </p>
            <p className="text-white text-sm font-semibold">@anshkosh</p>
          </div>
        </a>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium mb-0.5">Based in</p>
            <p className="text-white text-sm font-semibold">
              Hyderabad, India 🇮🇳
            </p>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <p className="relative z-10 mt-8 text-white/40 text-xs">
        Response time: within 24–48 hours on business days.
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
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`Subject: ${s}`}
          onClick={() => onChange(s)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
            value === s
              ? "bg-coral-500 border-coral-500 text-white shadow-sm shadow-coral-200"
              : "bg-white border-gray-200 text-gray-600 hover:border-coral-300 hover:text-coral-600"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition-all";

// ── Success state ─────────────────────────────────────────────────────────────

function SuccessState({
  name,
  onReset,
}: {
  name: string;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
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
          sent a confirmation to your inbox. Expect a reply within 24–48 hours.
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
    <div className="min-h-screen bg-gray-50/50 py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page heading */}
        <div className="mb-10 text-center">
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-coral-50 border border-coral-100 text-coral-600 text-xs font-semibold uppercase tracking-widest">
            Get in touch
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 tracking-tight">
            Contact Us
          </h1>
          <p className="mt-3 text-gray-500 text-lg max-w-md mx-auto">
            Questions, ideas, or feedback — we&apos;d love to hear from you.
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 grid grid-cols-1 lg:grid-cols-5"
        >
          {/* Left decorative panel — 2/5 */}
          <div className="lg:col-span-2">
            <LeftPanel />
          </div>

          {/* Right form panel — 3/5 */}
          <div className="lg:col-span-3 p-8 md:p-10">
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
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  noValidate
                >
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-gray-900 mb-1">
                      Send us a message
                    </h2>
                    <p className="text-sm text-gray-400">
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
                            : "text-gray-400"
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
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
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
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-coral-500 hover:bg-coral-600 active:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
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

                  <p className="text-center text-xs text-gray-400">
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
