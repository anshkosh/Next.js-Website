"use client";

import { useHydrated } from "@/components/useHydrated";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, AlertCircle } from "lucide-react";
import EditableImageUpload from "@/components/startup/EditableImageUpload";
import GalleryImageEditor from "@/components/startup/GalleryImageEditor";
import PitchDeckUpload from "@/components/startup/PitchDeckUpload";
import FounderManager from "@/components/startup/FounderManager";
import IconSelect from "@/components/startup/IconSelect";
import { wizardFields, startupFieldErrors, startupFieldLabel } from "@/lib/startup-wizard";
import StartupReview from "@/components/startup/StartupReview";
import { STARTUP_STAGES } from "@/lib/startup-stages";
import { useDraftRecovery } from "@/components/startup/useDraftRecovery";
import DraftRecoveryNotice from "@/components/startup/DraftRecoveryNotice";

const availableIcons = [
  "Zap", "Shield", "Rocket", "Globe", "Users", "Smartphone", "CheckCircle", "Star", "Heart",
  "Activity", "TrendingUp", "Award", "Key", "Lock", "Cloud", "Server", "Database", "Cpu", "Code", "Monitor"
];
import { createStartupSchema } from "@/lib/validators/startup.schema";
import { preferredScrollBehavior } from "@/lib/scroll-behavior";
import {
  createStartup,
  updateStartup,
  submitForReview,
} from "@/app/actions/startup.actions";

const STEP_META = [
  { label: "Basic Info",       minutes: 1,  pill: "quick one ⚡" },
  { label: "Details",          minutes: 3,  pill: "~3 min" },
  { label: "Core Proposition", minutes: 4,  pill: "the meaty part 🧠" },
  { label: "Founders & Team",  minutes: 2,  pill: "introduce your crew 👥" },
  { label: "Media & Features", minutes: 2,  pill: "show it off ✨" },
  { label: "Review & Submit",  minutes: 1,  pill: "almost done 🎉" },
] as const;

export default function StartupWizard({ userId, initialId, initialStep, initialData }: { userId: string; initialId: string | null; initialStep: number; initialData: ReturnType<typeof wizardFields> }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [startupId, setStartupId] = useState<string | null>(initialId);
  const [isSaving, setIsSaving] = useState(false);
  const [mediaBusy, setMediaBusy] = useState<Record<string, boolean>>({});
  const isMediaBusy = Object.values(mediaBusy).some(Boolean);
  const setUploadBusy = (key: string, busy: boolean) => setMediaBusy(previous => previous[key] === busy ? previous : { ...previous, [key]: busy });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [categories, setCategories] = useState<
    { id: string; name: string; iconName: string | null }[]
  >([]);

  const years = Array.from(
    { length: 75 },
    (_, i) => new Date().getFullYear() - i,
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  const [formData, setFormData] = useState(initialData);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [reviewVersion, setReviewVersion] = useState(0);
  const draft = useDraftRecovery(`anshkosh-draft:${userId}:${startupId ? `wizard:${startupId}` : "new"}`,
    { formData }, recovered => {
      setFormData(previous => ({ ...previous, ...recovered.formData }));
      setErrors({});
    });

  useEffect(() => {
    if (!startupId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("draft", startupId); url.searchParams.set("step", String(step));
    window.history.replaceState(null, "", url);
  }, [startupId, step]);

  function changeStep(next: number, id = startupId) {
    setErrors({}); setStep(next);
    if (id) {
      const url = new URL(window.location.href);
      url.searchParams.set("draft", id); url.searchParams.set("step", String(next));
      window.history.replaceState(null, "", url);
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error for the field
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };


  const validateStep = () => {
    // For simplicity, we create a partial schema for current step
    let keysToValidate: string[] = [];
    if (step === 1) keysToValidate = ["name", "tagline", "categoryId"];
    if (step === 2) keysToValidate = ["description", "websiteUrl", "twitterUrl", "linkedinUrl", "startupPhone", "city", "foundedYear", "logoUrl"];
    if (step === 5) keysToValidate = ["features", "videoUrl", "pitchDeckUrl", "galleryImages"];
    if (step === 3) keysToValidate = ["problemStatement", "solutionStatement", "targetAudience", "prototypeStatus"];

    if (step === 2) {
      const manualErrors: Record<string, string[]> = {};
      if (!formData.startupPhone || formData.startupPhone.length !== 10) {
        manualErrors.startupPhone = ["Please provide a valid 10-digit phone number"];
      }
      if (!formData.city) {
        manualErrors.city = ["City is required"];
      }
      if (!formData.foundedYear) {
        manualErrors.foundedYear = ["Founded Year is required"];
      }

      if (Object.keys(manualErrors).length > 0) {
        setErrors(manualErrors);
        const firstKey = Object.keys(manualErrors)[0];
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstKey}"]`);
          if (el) {
            el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
            (el as HTMLElement).focus?.();
          }
        }, 50);
        return false;
      }
    }

    // Step 3: manual required checks (Zod allows empty strings via .or(z.literal('')) for draft saves)
    if (step === 3) {
      const manualErrors: Record<string, string[]> = {};
      if (!formData.problemStatement || formData.problemStatement.length < 100) {
        manualErrors.problemStatement = [`Minimum 100 characters required (${formData.problemStatement.length} entered)`];
      }
      if (!formData.solutionStatement || formData.solutionStatement.length < 100) {
        manualErrors.solutionStatement = [`Minimum 100 characters required (${formData.solutionStatement.length} entered)`];
      }
      if (!formData.targetAudience) {
        manualErrors.targetAudience = ["Target Audience is required"];
      }
      if (!formData.prototypeStatus) {
        manualErrors.prototypeStatus = ["Please select your current build stage"];
      }
      if (Object.keys(manualErrors).length > 0) {
        setErrors(manualErrors);
        const firstKey = Object.keys(manualErrors)[0];
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstKey}"]`);
          if (el) {
            el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
            (el as HTMLElement).focus?.();
          }
        }, 50);
        return false;
      }
      return true;
    }

    // We mock validation by checking the main schema
    const dataToValidate = {
      ...formData,
      foundedYear: formData.foundedYear
        ? parseInt(formData.foundedYear, 10)
        : undefined,
    };

    const result = createStartupSchema.safeParse({
      ...dataToValidate,
      metadata: {
        twitterUrl: dataToValidate.twitterUrl || undefined,
        linkedinUrl: dataToValidate.linkedinUrl || undefined,
        pitchDeckUrl: formData.pitchDeckUrl,
        pitchDeckVisibility: formData.pitchDeckVisibility,
        city: dataToValidate.city || undefined,
        foundedYear: dataToValidate.foundedYear,
        features: formData.features,
      },
    });

    if (!result.success) {
      const fieldErrors = startupFieldErrors(result.error.issues);

      // Only care about errors for fields in this step
      const stepErrors: Record<string, string[]> = {};
      let hasError = false;

      Object.entries(fieldErrors).forEach(([key, messages]) => {
        if (keysToValidate.some(field => key === field || key.startsWith(`${field}.`))) {
          stepErrors[key] = messages; hasError = true;
        }
      });

      if (hasError) {
        setErrors(stepErrors);
        const firstErrorKey = Object.keys(stepErrors)[0];
        if (firstErrorKey) {
          setTimeout(() => {
            const el = document.querySelector(`[name="${firstErrorKey}"]`);
            if (el) {
              el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
              (el as HTMLElement).focus?.();
            }
          }, 50);
        }
        return false;
      }
    }

    return true;
  };

  const saveDraft = async (nextStep = step) => {
    if (isMediaBusy || isSaving) return false;
    setIsSaving(true); setErrors({});
    const snapshot = formData;
    const data = new FormData();
    Object.entries(snapshot).forEach(([key, value]) => {
      if (key === "galleryImages") {
        if (!(value as string[]).length) data.append("galleryImages", "");
        (value as string[]).forEach(img => data.append("galleryImages", img));
      } else if (key === "features") data.append(key, JSON.stringify(value));
      else data.append(key, value as string);
    });
    try {
      if (startupId) data.append("id", startupId);
      const res = startupId ? await updateStartup(data) : await createStartup(data);
      if (res.error) {
        if (res.details && Object.keys(res.details).some(key => key.startsWith("features."))) changeStep(5);
        setErrors(res.details ? res.details as Record<string, string[]> : { form: [res.error] });
        return false;
      }
      const id = res.data?.id ?? startupId;
      if (!id) { setErrors({ form: ["We could not confirm your draft. Please try again."] }); return false; }
      setStartupId(id);
      draft.markSaved({ formData: snapshot });
      setLastSaved(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      changeStep(nextStep, id);
      if (nextStep === 6) setReviewVersion(version => version + 1);
      return true;
    } catch {
      setErrors({ form: ["We could not confirm the save. Your entries are still here; check your connection and try again."] });
      return false;
    } finally { setIsSaving(false); }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    await saveDraft(Math.min(step + 1, 6));
  };

  const handleSubmitReview = async () => {
    if (!startupId) return;
    const ok = await saveDraft();
    if (!ok) {
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    try {
    const res = await submitForReview(startupId);
    if (res.error) {
      setErrors({ form: [res.error] });
      setIsSaving(false);
    } else {
      if (res.notificationPending) alert("Your startup was submitted successfully. Its notification is delayed and will be retried automatically.");
      draft.markSaved();
      router.push("/dashboard");
    }
    } catch { setErrors({ form: ["We could not confirm submission. Check your dashboard before trying again."] }); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-3 font-heading">Submit your Startup</h1>
      <div className="mb-4"><DraftRecoveryNotice draft={draft} />{lastSaved && !draft.dirty && <p role="status" className="mt-1 text-sm text-green-800 tabular-nums">Draft saved at {lastSaved}</p>}</div>

      {/* Hero time badge — shown only on step 1 */}
      {step === 1 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-6">
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
            ☕ Grab a coffee — this takes about <strong className="text-gray-700">13 minutes</strong> to complete.
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
            ✓ Save as draft anytime
          </span>
        </div>
      )}

      {/* Progress Indicator — flex dividers, no absolute positioning */}
      <div className="flex items-center mb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <React.Fragment key={i}>
            <div
              className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${
                step >= i
                  ? "bg-coral-600 border-coral-600 text-white"
                  : "bg-white border-gray-300 text-gray-500"
              }`}
            >
              {i}
            </div>
            {i < 6 && (
              <div
                className={`flex-1 h-0.5 transition-colors duration-300 ${
                  step > i ? "bg-coral-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Time remaining pill — shown on steps 2–5 */}
      {step >= 2 && step <= 5 && (() => {
        const remaining = STEP_META.slice(step - 1).reduce((sum, s) => sum + s.minutes, 0);
        return (
          <p className="text-right text-xs text-gray-500 mb-6">
            ⏱ ~{remaining} min left — you&apos;re doing great!
          </p>
        );
      })()}
      {(step === 1 || step === 6) && <div className="mb-6" />}

      <fieldset disabled={!hydrated || isSaving} className="min-w-0 bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold font-heading">Step 1: Basic Info</h2>
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[0].pill}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Startup Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tagline
              </label>
              <input
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Brief one-liner"
              />
              {errors.tagline && (
                <p className="text-red-500 text-xs mt-1">{errors.tagline[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full border rounded-md p-2 bg-white"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.categoryId[0]}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold font-heading">Step 2: Details</h2>
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[1].pill}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border rounded-md p-2 h-32"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description[0]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
              {errors.websiteUrl && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.websiteUrl[0]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Startup Logo
              </label>

              <EditableImageUpload kind="logo" label="Startup logo" value={formData.logoUrl} onChange={url => setFormData(previous => ({ ...previous, logoUrl: url }))} onBusyChange={busy => setUploadBusy("logo", busy)} />
        {errors.logoUrl && (
                <p className="text-red-500 text-xs mt-2 text-center">{errors.logoUrl[0]}</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter URL
                </label>
                <input
                  name="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={handleChange}
                  className={`w-full border rounded-md p-2 ${errors.twitterUrl ? "border-red-500 bg-red-50/20" : ""}`}
                />
                {errors.twitterUrl && (
                  <p className="text-red-500 text-xs mt-1">{errors.twitterUrl[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  className={`w-full border rounded-md p-2 ${errors.linkedinUrl ? "border-red-500 bg-red-50/20" : ""}`}
                />
                {errors.linkedinUrl && (
                  <p className="text-red-500 text-xs mt-1">{errors.linkedinUrl[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="startupPhone"
                  value={formData.startupPhone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  className={`w-full border rounded-md p-2 ${errors.startupPhone ? "border-red-500 bg-red-50/20" : ""}`}
                />
                <p className="text-xs text-gray-500 mt-1">10-digit mobile number</p>
                {errors.startupPhone && (
                  <p className="text-red-500 text-xs mt-1">{errors.startupPhone[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full border rounded-md p-2 ${errors.city ? "border-red-500 bg-red-50/20" : ""}`}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Founded Year <span className="text-red-500">*</span>
                </label>
                <select
                  name="foundedYear"
                  value={formData.foundedYear}
                  onChange={handleChange}
                  className={`w-full border rounded-md p-2 bg-white ${errors.foundedYear ? "border-red-500 bg-red-50/20" : ""}`}
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.foundedYear && (
                  <p className="text-red-500 text-xs mt-1">{errors.foundedYear[0]}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold font-heading">Step 3: Core Proposition</h2>
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[2].pill}</span>
            </div>

            {/* Problem Statement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  The Problem <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${
                  formData.problemStatement.length > 0 && formData.problemStatement.length < 100
                    ? "text-red-500 font-medium"
                    : "text-gray-500"
                }`}>
                  {formData.problemStatement.length}/800
                  {formData.problemStatement.length > 0 && formData.problemStatement.length < 100 && " (min 100)"}
                </span>
              </div>
              <textarea
                name="problemStatement"
                value={formData.problemStatement}
                onChange={handleChange}
                rows={5}
                maxLength={800}
                placeholder="Describe the core problem your startup solves. Be specific — what pain point exists, who suffers from it, and why current solutions fall short."
                className={`w-full border rounded-md p-3 resize-none leading-relaxed ${
                  errors.problemStatement ? "border-red-500 bg-red-50/20" : "border-gray-300"
                }`}
              />
              {errors.problemStatement && (
                <p className="text-red-500 text-xs mt-1">{errors.problemStatement[0]}</p>
              )}
            </div>

            {/* Solution & Value Proposition */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Solution & Value Proposition <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${
                  formData.solutionStatement.length > 0 && formData.solutionStatement.length < 100
                    ? "text-red-500 font-medium"
                    : "text-gray-500"
                }`}>
                  {formData.solutionStatement.length}/1000
                  {formData.solutionStatement.length > 0 && formData.solutionStatement.length < 100 && " (min 100)"}
                </span>
              </div>
              <textarea
                name="solutionStatement"
                value={formData.solutionStatement}
                onChange={handleChange}
                rows={5}
                maxLength={1000}
                placeholder="Explain your solution and its unique value. How does it address the problem? What makes it different or better than existing alternatives?"
                className={`w-full border rounded-md p-3 resize-none leading-relaxed ${
                  errors.solutionStatement ? "border-red-500 bg-red-50/20" : "border-gray-300"
                }`}
              />
              {errors.solutionStatement && (
                <p className="text-red-500 text-xs mt-1">{errors.solutionStatement[0]}</p>
              )}
            </div>

            {/* Target Audience */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Target Audience & Ideal Customer <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-500">{formData.targetAudience.length}/500</span>
              </div>
              <textarea
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Who is this for? Describe your ideal customer — their role, industry, or situation."
                className={`w-full border rounded-md p-3 resize-none leading-relaxed ${
                  errors.targetAudience ? "border-red-500 bg-red-50/20" : "border-gray-300"
                }`}
              />
              {errors.targetAudience && (
                <p className="text-red-500 text-xs mt-1">{errors.targetAudience[0]}</p>
              )}
            </div>

            {/* Prototype Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prototype / Build Status <span className="text-red-500">*</span>
              </label>
              <select
                name="prototypeStatus"
                value={formData.prototypeStatus}
                onChange={handleChange}
                className={`w-full border rounded-md p-2 bg-white ${
                  errors.prototypeStatus ? "border-red-500 bg-red-50/20" : "border-gray-300"
                }`}
              >
                <option value="">Select your current build stage</option>
                {STARTUP_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
              </select>
              {errors.prototypeStatus && (
                <p className="text-red-500 text-xs mt-1">{errors.prototypeStatus[0]}</p>
              )}
            </div>

            {/* Traction Evidence (optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Existing Proof Points & Traction
                  <span className="ml-1.5 text-xs font-normal text-gray-500">(Optional)</span>
                </label>
                <span className="text-xs text-gray-500">{formData.tractionEvidence.length}/600</span>
              </div>
              <textarea
                name="tractionEvidence"
                value={formData.tractionEvidence}
                onChange={handleChange}
                rows={3}
                maxLength={600}
                placeholder="Any early users, revenue, pilots, letters of intent, press coverage, or other validation? Leave blank if none yet."
                className="w-full border border-gray-300 rounded-md p-3 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-heading">Step 4: Founders &amp; Team</h2>
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[3].pill}</span>
            </div>
            <FounderManager startupId={startupId!} onBusyChange={busy => setUploadBusy("founders", busy)} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold font-heading">Step 5: Media &amp; Features</h2>
              <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[4].pill}</span>
            </div>

            {/* Video Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Demo URL (Optional)
              </label>
              <input
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full border rounded-md p-2 bg-white"
              />
              {formData.videoUrl && (
                <div className="mt-4 w-full md:w-3/4 aspect-video bg-gray-100 rounded-xl overflow-hidden border">
                  {(() => {
                    const yt = formData.videoUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
                    const vim = formData.videoUrl.match(/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
                    const embedUrl = yt && yt[2].length === 11
                      ? `https://www.youtube.com/embed/${yt[2]}`
                      : vim ? `https://player.vimeo.com/video/${vim[1]}` : null;

                    if (embedUrl) {
                      return <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>;
                    }
                    return <div className="flex items-center justify-center h-full text-gray-500">Invalid or unsupported video URL</div>;
                  })()}
                </div>
              )}
            </div>

            <GalleryImageEditor images={formData.galleryImages} onChange={images => setFormData(previous => ({ ...previous, galleryImages: images }))} onBusyChange={busy => setUploadBusy("gallery", busy)} />
      <PitchDeckUpload value={formData.pitchDeckUrl} visibility={formData.pitchDeckVisibility} onVisibilityChange={visibility => setFormData(previous => ({ ...previous, pitchDeckVisibility: visibility }))} onChange={url => setFormData(previous => ({ ...previous, pitchDeckUrl: url }))} onBusyChange={busy => setUploadBusy("deck", busy)} />
      {/* Key Features Builder */}
            <div className="pt-6 border-t border-gray-100 mt-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Key Features (Max 6)
                </label>
                <span className="text-xs text-gray-500">{formData.features.length}/6 added</span>
              </div>

              <div className="space-y-4">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="p-5 border border-gray-200 rounded-xl bg-gray-50/50 relative group">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, features: p.features.filter((_, i) => i !== idx) }))}
                      aria-label={`Remove feature ${idx + 1}`}
                      className="absolute -top-2 -right-2 flex h-11 w-11 items-center justify-center bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                        <IconSelect
                          value={feature.icon}
                          onChange={(iconName) => {
                            const newFeatures = [...formData.features];
                            newFeatures[idx] = { ...newFeatures[idx], icon: iconName };
                            setFormData((p) => ({ ...p, features: newFeatures }));
                          }}
                          availableIcons={availableIcons}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                        <input
                          id={`features.${idx}.title`}
                          name={`features.${idx}.title`}
                          aria-label={`Feature ${idx + 1} title`}
                          aria-invalid={Boolean(errors[`features.${idx}.title`])}
                          aria-describedby={errors[`features.${idx}.title`] ? `feature-${idx}-title-error` : undefined}
                          maxLength={50}
                          value={feature.title}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                            setErrors(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== `features.${idx}.title`)));
                            setFormData(p => ({ ...p, features: newFeatures }));
                          }}
                          className="w-full border border-gray-200 rounded-md p-2 bg-white text-sm focus:ring-coral-500 focus:border-coral-500 outline-none"
                          placeholder="e.g. Blazing Fast"
                        />
                        {errors[`features.${idx}.title`] && <p id={`feature-${idx}-title-error`} className="mt-1 text-xs text-red-700">{errors[`features.${idx}.title`][0]}</p>}
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description (Max 150 chars)</label>
                        <input
                          id={`features.${idx}.description`}
                          name={`features.${idx}.description`}
                          aria-label={`Feature ${idx + 1} description`}
                          aria-invalid={Boolean(errors[`features.${idx}.description`])}
                          aria-describedby={errors[`features.${idx}.description`] ? `feature-${idx}-description-error` : undefined}
                          value={feature.description}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[idx] = { ...newFeatures[idx], description: e.target.value };
                            setErrors(previous => Object.fromEntries(Object.entries(previous).filter(([key]) => key !== `features.${idx}.description`)));
                            setFormData(p => ({ ...p, features: newFeatures }));
                          }}
                          maxLength={150}
                          className="w-full border border-gray-200 rounded-md p-2 bg-white text-sm focus:ring-coral-500 focus:border-coral-500 outline-none"
                          placeholder="Short description of this feature..."
                        />
                        {errors[`features.${idx}.description`] && <p id={`feature-${idx}-description-error`} className="mt-1 text-xs text-red-700">{errors[`features.${idx}.description`][0]}</p>}
                      </div>
                    </div>
                  </div>
                ))}

                {formData.features.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, features: [...p.features, { icon: "Zap", title: "", description: "" }] }))}
                    className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-coral-400 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-coral-500 transition-colors bg-white hover:bg-coral-50/30"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-medium">Add Feature</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold font-heading">Step 6: Review &amp; Submit</h2>
              <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[5].pill}</span>
            </div>
            <StartupReview data={formData} startupId={startupId!} category={categories.find(category => category.id === formData.categoryId)?.name || ""} version={reviewVersion} onEdit={changeStep} />
          </div>
        )}

        {/* Error banner — fixed min-height so buttons don't jump when it appears/disappears */}
        <div className="mt-5 min-h-[52px]">
          {Object.keys(errors).length > 0 && (
            <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                {errors.form ? (
                  <strong>{errors.form.join(", ")}</strong>
                ) : (
                  <>Please check: <strong>{Object.keys(errors).map(startupFieldLabel).join(", ")}</strong>. {Object.values(errors).flat()[0]}</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Navigation buttons — flex-wrap safe for small screens */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <button
            onClick={() => changeStep(Math.max(step - 1, 1))}
            disabled={step === 1 || isSaving || isMediaBusy}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveDraft()}
              disabled={isSaving || isMediaBusy || !startupId}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40 transition-colors"
            >
              {isSaving ? "Saving…" : "Save Draft"}
            </button>
            {step < 6 ? (
              <button
                onClick={handleNext}
                disabled={isSaving || isMediaBusy}
                className="px-6 py-2.5 bg-coral-600 text-white rounded-xl text-sm font-semibold hover:bg-coral-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSaving ? "Saving…" : "Next"}
              </button>
            ) : (
              <button
                onClick={handleSubmitReview}
                disabled={isSaving || isMediaBusy}
                className="px-6 py-2.5 bg-coral-600 text-white rounded-xl text-sm font-semibold hover:bg-coral-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSaving ? "Submitting…" : "Submit for Review"}
              </button>
            )}
          </div>
        </div>
      </fieldset>
    </div>
    </div>
  );
}
