"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, AlertCircle, Zap } from "lucide-react";
import EditableImageUpload from "@/components/startup/EditableImageUpload";
import GalleryImageEditor from "@/components/startup/GalleryImageEditor";
import PitchDeckUpload from "@/components/startup/PitchDeckUpload";
import FounderManager from "@/components/startup/FounderManager";
import IconSelect from "@/components/startup/IconSelect";
import { updateStartup } from "@/app/actions/startup.actions";
import { updateStartupSchema } from "@/lib/validators/startup.schema";
import Link from "next/link";
import { STARTUP_STAGES } from "@/lib/startup-stages";
import { useDraftRecovery } from "@/components/startup/useDraftRecovery";
import DraftRecoveryNotice from "@/components/startup/DraftRecoveryNotice";
import type { Startup } from "@prisma/client";
import { startupFieldErrors, startupFieldLabel } from "@/lib/startup-wizard";
import { startupMetadataFields } from "@/lib/startup-metadata";
import { preferredScrollBehavior } from "@/lib/scroll-behavior";

const availableIcons = [
  "Zap", "Shield", "Rocket", "Globe", "Users", "Smartphone", "CheckCircle", "Star", "Heart", 
  "Activity", "TrendingUp", "Award", "Key", "Lock", "Cloud", "Server", "Database", "Cpu", "Code", "Monitor"
];

export default function EditStartupForm({ initialData, userId, categories }: { categories: { id: string; name: string; iconName: string | null }[]; initialData: Partial<Startup> & Pick<Startup, "id" | "status"> & { revisionStatus?: string; revisionNotes?: string | null }; userId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [mediaBusy, setMediaBusy] = useState<Record<string, boolean>>({});
  const isMediaBusy = Object.values(mediaBusy).some(Boolean);
  const setUploadBusy = (key: string, busy: boolean) => setMediaBusy(previous => previous[key] === busy ? previous : { ...previous, [key]: busy });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const scrollToFirstError = useCallback(() => {
    const errorText = document.querySelector(".text-red-500");
    if (errorText) {
      errorText.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
      const parentInput = errorText.parentElement?.querySelector("input, textarea, select");
      if (parentInput) {
        (parentInput as HTMLElement).focus?.({ preventScroll: true });
      }
      return;
    }

    for (const key of Object.keys(errors)) {
      const el = document.querySelector(`[name="${key}"]`);
      if (el) {
        el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
        (el as HTMLElement).focus?.({ preventScroll: true });
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: preferredScrollBehavior() });
  }, [errors]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const timer = setTimeout(() => {
        scrollToFirstError();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [errors, scrollToFirstError]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1970 + 1 }, (_, i) => currentYear - i);

  const metadata = startupMetadataFields(initialData.metadata);

  const [formData, setFormData] = useState({
    id: initialData.id,
    name: initialData.name || "",
    tagline: initialData.tagline || "",
    categoryId: initialData.categoryId || "",
    founderName: initialData.founderName || "",
    description: initialData.description || "",
    websiteUrl: initialData.websiteUrl || "",
    logoUrl: initialData.logoUrl || "",
    twitterUrl: metadata.twitterUrl || "",
    linkedinUrl: metadata.linkedinUrl || "",
    city: metadata.city || "",
    foundedYear: metadata.foundedYear ? metadata.foundedYear.toString() : "",
    videoUrl: initialData.videoUrl || "",
    pitchDeckUrl: metadata.pitchDeckUrl || "",
    pitchDeckVisibility: metadata.pitchDeckVisibility || (metadata.pitchDeckUrl ? "public" : "private"),
    galleryImages: (initialData.galleryImages || []) as string[],
    features: (metadata.features || []) as { icon: string; title: string; description: string }[],
    // Founder contact
    startupPhone: initialData.startupPhone || "",
    // Core Proposition
    problemStatement: initialData.problemStatement || "",
    solutionStatement: initialData.solutionStatement || "",
    targetAudience: initialData.targetAudience || "",
    prototypeStatus: initialData.prototypeStatus || "",
    tractionEvidence: initialData.tractionEvidence || "",
  });

  const draft = useDraftRecovery(`anshkosh-draft:${userId}:edit:${initialData.id}`, formData, recovered => { setErrors({}); setFormData(previous => ({ ...previous, ...recovered, id: initialData.id })); }, true, initialData.updatedAt ? new Date(initialData.updatedAt).getTime() : undefined);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMediaBusy) return;
    setIsSaving(true);

    const dataToValidate = {
      ...formData,
      foundedYear: formData.foundedYear
        ? parseInt(formData.foundedYear, 10)
        : undefined,
    };

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
      setReviewing(false);
      setErrors(manualErrors);
      setIsSaving(false);
      const firstKey = Object.keys(manualErrors)[0];
      setTimeout(() => {
        const el = document.querySelector(`[name="${firstKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: preferredScrollBehavior(), block: "center" });
          (el as HTMLElement).focus?.();
        }
      }, 50);
      return;
    }

    const result = updateStartupSchema.safeParse({
      ...dataToValidate,
      metadata: {
        twitterUrl: dataToValidate.twitterUrl || undefined,
        linkedinUrl: dataToValidate.linkedinUrl || undefined,
        pitchDeckUrl: formData.pitchDeckUrl,
        pitchDeckVisibility: formData.pitchDeckVisibility,
        city: dataToValidate.city || undefined,
        features: formData.features,
        foundedYear: dataToValidate.foundedYear,
      },
    });

    if (!result.success) {
      const fieldErrors = startupFieldErrors(result.error.issues);
      setReviewing(false);
      setErrors(fieldErrors);
      setIsSaving(false);
      return;
    }

    if (!reviewing) { setReviewing(true); setIsSaving(false); window.scrollTo({ top: 0, behavior: preferredScrollBehavior() }); return; }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "galleryImages") {
        if (!(value as string[]).length) data.append("galleryImages", "");
        (value as string[]).forEach((img) => data.append("galleryImages", img));
      } else if (key === "features") {
        data.append("features", JSON.stringify(value));
      } else if (key === "pitchDeckUrl" || key === "logoUrl") {
        data.append(key, value as string);
      } else if (value) {
        data.append(key, value as string);
      }
    });

    let res: Awaited<ReturnType<typeof updateStartup>>;
    try { res = await updateStartup(data); }
    catch {
      setIsSaving(false); setReviewing(false);
      setErrors({ form: ["We could not confirm the save. Check your dashboard before retrying; your recovery copy stays on this device."] });
      return;
    }
    setIsSaving(false);

    if (res.error) {
      setReviewing(false);
      if (res.details) {
        setErrors(res.details as Record<string, string[]>);
      } else {
        setErrors({ form: [res.error] });
      }
    } else {
      draft.markSaved();
      router.push("/dashboard");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6"
    >
      <DraftRecoveryNotice draft={draft} />
      {reviewing && <section aria-labelledby="review-heading" className="space-y-5"><h2 id="review-heading" className="font-heading text-2xl font-bold">Review your changes</h2><p className="text-sm text-gray-600">Check your proposed profile before saving. Your current public profile stays live while changes are reviewed.</p><dl className="space-y-4">{[["Name", formData.name], ["Category", categories.find(item => item.id === formData.categoryId)?.name || formData.categoryId], ["Founder", formData.founderName], ["Contact phone (private)", formData.startupPhone], ["Tagline", formData.tagline], ["Description", formData.description], ["Website", formData.websiteUrl], ["Problem", formData.problemStatement], ["Solution", formData.solutionStatement], ["Audience", formData.targetAudience], ["Stage", formData.prototypeStatus], ["Evidence", formData.tractionEvidence], ["City", formData.city], ["Founded", formData.foundedYear], ["Logo", formData.logoUrl], ["Video", formData.videoUrl], ["Pitch deck", formData.pitchDeckUrl], ["Pitch deck visibility", formData.pitchDeckVisibility], ["X / Twitter", formData.twitterUrl], ["LinkedIn", formData.linkedinUrl], ["Features", formData.features.map(item => `${item.title}: ${item.description}`).join("; ")], ["Gallery", `${formData.galleryImages.length} images`]].map(([label, value]) => <div key={label}><dt className="text-sm font-semibold">{label}</dt><dd className="whitespace-pre-wrap break-words text-sm text-gray-700">{value || "Not provided"}</dd></div>)}</dl><button type="button" onClick={() => setReviewing(false)} className="min-h-11 font-semibold text-coral-700 underline">Back to editing</button></section>}
      <div hidden={reviewing}>
      {initialData.revisionStatus && <p role="status" className="rounded-lg bg-gray-50 p-3 text-sm">{initialData.revisionStatus === "REJECTED" ? `Changes need attention: ${initialData.revisionNotes || "Please revise and resubmit."}` : "Your proposed changes are awaiting review. The published profile remains live."}</p>}
      {initialData.status === "LIVE" && (
        <div className="bg-amber-50 text-amber-900 p-4 rounded-xl text-sm border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Saving will submit for re-review</p>
            <p className="text-amber-800">
              Your changes will be reviewed before publication. Your current startup profile stays live.
              Making your pitch deck private takes effect as soon as you save.
            </p>
            <p className="text-amber-700 text-xs mt-1">
              Want to post a quick update without re-review?{" "}
              <Link
                href={`/startup/${initialData.id}/updates`}
                className="underline font-semibold hover:text-amber-900"
              >
                Go to Founder updates →
              </Link>
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Startup Name
        </label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full border rounded-md p-2 ${errors.name ? "border-red-500 bg-red-50/20" : ""}`}
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
          className={`w-full border rounded-md p-2 ${errors.tagline ? "border-red-500 bg-red-50/20" : ""}`}
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
          className={`w-full border rounded-md p-2 bg-white ${errors.categoryId ? "border-red-500 bg-red-50/20" : ""}`}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-red-500 text-xs mt-1">{errors.categoryId[0]}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={`w-full border rounded-md p-2 h-32 ${errors.description ? "border-red-500 bg-red-50/20" : ""}`}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>
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
          className={`w-full border rounded-md p-2 ${errors.websiteUrl ? "border-red-500 bg-red-50/20" : ""}`}
        />
        {errors.websiteUrl && (
          <p className="text-red-500 text-xs mt-1">{errors.websiteUrl[0]}</p>
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

      <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
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

      {/* Core Proposition */}
      <div className="pt-6 border-t border-gray-100 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Core Proposition</h3>

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

      {/* Video Link */}
      <div className="pt-6 border-t border-gray-100">
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
      <div className="pt-6 border-t border-gray-100">
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
                className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 shadow-sm"
              >
                <X className="w-3 h-3" />
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
                  {errors[`features.${idx}.title`] && <p id={`feature-${idx}-title-error`} className="text-red-500 text-xs mt-1">{errors[`features.${idx}.title`][0]}</p>}
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description (Max 150 chars)</label>
                  <input
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
                  {errors[`features.${idx}.description`] && <p id={`feature-${idx}-description-error`} className="text-red-500 text-xs mt-1">{errors[`features.${idx}.description`][0]}</p>}
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

      {/* Founders Manager */}
      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Founders & Team</h3>
        <FounderManager startupId={formData.id} onBusyChange={busy => setUploadBusy("founders", busy)} />
      </div>

      {/* Updates are now managed from the dedicated Updates page */}
      {initialData.status === "LIVE" && (
        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-coral-500" />
                Founder updates
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Post milestones and news — they go live immediately without re-review.
              </p>
            </div>
            <Link
              href={`/startup/${formData.id}/updates`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-coral-50 border border-coral-200 text-coral-700 rounded-lg text-sm font-semibold hover:bg-coral-100 transition-colors shrink-0"
            >
              <Zap className="w-4 h-4" /> Manage Updates
            </Link>
          </div>
        </div>
      )}

      </div>
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>
              {errors.form ? (
                <strong>{errors.form.join(", ")}</strong>
              ) : (
                <>Validation failed for {Object.keys(errors).length} field(s):{" "}
                <strong>{Object.keys(errors).map(startupFieldLabel).join(", ")}</strong>. Please scroll up and fix them.</>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={scrollToFirstError}
            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs font-semibold shrink-0 transition-colors"
          >
            Fix Errors
          </button>
        </div>
      )}

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={isSaving || isMediaBusy}
          className="px-6 py-2 bg-coral-600 text-white rounded-md hover:bg-coral-700 disabled:opacity-50 font-medium"
        >
          {isSaving ? "Saving..." : reviewing ? "Confirm and save changes" : "Review changes"}
        </button>
      </div>
    </form>
  );
}
