"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, X, Check, Image as ImageIcon, Plus, AlertCircle } from "lucide-react";
import FounderManager from "@/components/startup/FounderManager";
import IconSelect from "@/components/startup/IconSelect";

const availableIcons = [
  "Zap", "Shield", "Rocket", "Globe", "Users", "Smartphone", "CheckCircle", "Star", "Heart", 
  "Activity", "TrendingUp", "Award", "Key", "Lock", "Cloud", "Server", "Database", "Cpu", "Code", "Monitor"
];
import { createStartupSchema } from "@/lib/validators/startup.schema";
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

export default function NewStartupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [startupId, setStartupId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    categoryId: "",
    founderName: "",
    description: "",
    websiteUrl: "",
    logoUrl: "",
    twitterUrl: "",
    linkedinUrl: "",
    city: "",
    foundedYear: "",
    videoUrl: "",
    galleryImages: [] as string[],
    features: [] as { icon: string; title: string; description: string }[],
    // Founder contact
    startupPhone: "",
    // Core Proposition
    problemStatement: "",
    solutionStatement: "",
    targetAudience: "",
    prototypeStatus: "",
    tractionEvidence: "",
  });

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

  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");
  const [imageError, setImageError] = useState(false);

  const uploadLogoFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, SVG, WebP, etc.)");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setLogoPreviewUrl(localPreview);
    setImageError(false);

    setIsUploadingLogo(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/uploads/logo", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        setFormData((prev) => ({ ...prev, logoUrl: result.url }));
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error. Please try again.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadLogoFile(file);
    }
  };

  const validateStep = () => {
    // For simplicity, we create a partial schema for current step
    let keysToValidate: string[] = [];
    if (step === 1) keysToValidate = ["name", "tagline", "categoryId"];
    if (step === 2) keysToValidate = ["description", "websiteUrl", "twitterUrl", "linkedinUrl", "startupPhone", "city", "foundedYear", "logoUrl"];
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
            el.scrollIntoView({ behavior: "smooth", block: "center" });
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
            el.scrollIntoView({ behavior: "smooth", block: "center" });
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
        city: dataToValidate.city || undefined,
        foundedYear: dataToValidate.foundedYear,
      },
    });

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === "metadata" && issue.path[1]) {
          const fieldName = issue.path[1] as string;
          if (!fieldErrors[fieldName]) fieldErrors[fieldName] = [];
          fieldErrors[fieldName].push(issue.message);
        } else {
          const fieldName = issue.path[0] as string;
          if (!fieldErrors[fieldName]) fieldErrors[fieldName] = [];
          fieldErrors[fieldName].push(issue.message);
        }
      });

      // Only care about errors for fields in this step
      const stepErrors: Record<string, string[]> = {};
      let hasError = false;

      keysToValidate.forEach((key) => {
        if (fieldErrors[key]) {
          stepErrors[key] = fieldErrors[key];
          hasError = true;
        }
      });

      if (hasError) {
        setErrors(stepErrors);
        const firstErrorKey = Object.keys(stepErrors)[0];
        if (firstErrorKey) {
          setTimeout(() => {
            const el = document.querySelector(`[name="${firstErrorKey}"]`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              (el as HTMLElement).focus?.();
            }
          }, 50);
        }
        return false;
      }
    }

    return true;
  };

  const saveDraft = async () => {
    setIsSaving(true);
    let success = true;
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "galleryImages") {
        (value as string[]).forEach((img) => data.append("galleryImages", img));
      } else if (key === "features") {
        data.append("features", JSON.stringify(value));
      } else if (value) {
        data.append(key, value as string);
      }
    });

    if (startupId) {
      data.append("id", startupId);
      const res = await updateStartup(data);
      if (res.error) {
        if (res.details) setErrors(res.details as Record<string, string[]>);
        else setErrors({ form: [res.error] });
        success = false;
      }
    } else {
      const res = await createStartup(data);
      if (res.data) setStartupId(res.data.id);
      if (res.error) {
        if (res.details) setErrors(res.details as Record<string, string[]>);
        else setErrors({ form: [res.error] });
        success = false;
      }
    }
    setIsSaving(false);
    return success;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if ((step === 1 || step === 2) && !startupId) {
      // Auto save draft on step 1 and 2 to preserve phone/linkedin data
      const ok = await saveDraft();
      if (!ok) return;
    } else if (step === 2 && startupId) {
      const ok = await saveDraft();
      if (!ok) return;
    }

    setStep((prev) => Math.min(prev + 1, 6));
  };

  const handleSubmitReview = async () => {
    if (!startupId) return;
    setIsSaving(true);
    const ok = await saveDraft();
    if (!ok) {
      setIsSaving(false);
      return;
    }
    
    const res = await submitForReview(startupId);
    if (res.error) {
      if ((res as any).details) setErrors((res as any).details as Record<string, string[]>);
      else setErrors({ form: [res.error] });
      setIsSaving(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-3 font-heading">Submit your Startup</h1>

      {/* Hero time badge — shown only on step 1 */}
      {step === 1 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-6">
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
            ☕ Grab a coffee — this takes about <strong className="text-gray-700">10–12 minutes</strong> to complete.
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
                  ? "bg-coral-500 border-coral-500 text-white"
                  : "bg-white border-gray-300 text-gray-400"
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
        const remaining = STEP_META.slice(step).reduce((sum, s) => sum + s.minutes, 0);
        return (
          <p className="text-right text-xs text-gray-400 mb-6">
            ⏱ ~{remaining} min left — you&apos;re doing great!
          </p>
        );
      })()}
      {(step === 1 || step === 6) && <div className="mb-6" />}

      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold font-heading">Step 1: Basic Info</h2>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[0].pill}</span>
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
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[1].pill}</span>
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

              {formData.logoUrl || logoPreviewUrl ? (
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/80">
                  <div className="flex items-center space-x-4">
                    {!imageError ? (
                      <img
                        src={logoPreviewUrl || formData.logoUrl}
                        alt="Logo Preview"
                        onError={() => setImageError(true)}
                        className="w-16 h-16 object-contain rounded-lg border bg-white p-1 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center rounded-lg border bg-gray-100 text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-green-500" /> Logo uploaded successfully
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Click remove to upload a different logo</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, logoUrl: "" }));
                      setLogoPreviewUrl("");
                      setImageError(false);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove logo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : isUploadingLogo ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-coral-200 rounded-xl p-8 bg-coral-50/20">
                  <Loader2 className="w-8 h-8 text-coral-500 animate-spin mb-2" />
                  <p className="text-sm font-medium text-gray-700">Uploading logo...</p>
                  <p className="text-xs text-gray-400 mt-1">Please wait a moment</p>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) uploadLogoFile(file);
                  }}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-coral-500 bg-coral-50/50 scale-[1.01]"
                      : "border-gray-300 hover:border-coral-400 hover:bg-gray-50/80 bg-white"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-coral-50 flex items-center justify-center mb-3 text-coral-500">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    Click to upload logo <span className="font-normal text-gray-500">or drag & drop</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG or WebP (recommended square, max 5MB)</p>
                </label>
              )}
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
                <p className="text-xs text-gray-400 mt-1">10-digit mobile number</p>
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
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[2].pill}</span>
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
                    : "text-gray-400"
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
                    : "text-gray-400"
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
                <span className="text-xs text-gray-400">{formData.targetAudience.length}/500</span>
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
                <option value="Working Software Prototype (Functional Beta)">Working Software Prototype (Functional Beta)</option>
                <option value="Physical Prototype / Hardware Sample Built">Physical Prototype / Hardware Sample Built</option>
                <option value="Production-Ready V1 (Preparing Pilot Run)">Production-Ready V1 (Preparing Pilot Run)</option>
                <option value="Active Live Service (Testing New Feature/Location)">Active Live Service (Testing New Feature/Location)</option>
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
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(Optional)</span>
                </label>
                <span className="text-xs text-gray-400">{formData.tractionEvidence.length}/600</span>
              </div>
              <textarea
                name="tractionEvidence"
                value={formData.tractionEvidence}
                onChange={handleChange}
                rows={3}
                maxLength={600}
                placeholder="Any early users, revenue, pilots, letters of intent, waitlist signups, press coverage, or other validation? Leave blank if none yet."
                className="w-full border border-gray-300 rounded-md p-3 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-heading">Step 4: Founders &amp; Team</h2>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[3].pill}</span>
            </div>
            <FounderManager startupId={startupId!} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold font-heading">Step 5: Media &amp; Features</h2>
              <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full shrink-0 ml-3">{STEP_META[4].pill}</span>
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
                    return <div className="flex items-center justify-center h-full text-gray-400">Invalid or unsupported video URL</div>;
                  })()}
                </div>
              )}
            </div>

            {/* Gallery Uploader */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Gallery Images (Optional, max 4)
                </label>
                <span className="text-xs text-gray-500">{formData.galleryImages.length}/4 uploaded</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.galleryImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border shadow-sm group">
                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFormData(p => ({ ...p, galleryImages: p.galleryImages.filter((_, i) => i !== idx) }))}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {formData.galleryImages.length < 4 && (
                  <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 hover:border-coral-400 rounded-lg bg-gray-50 hover:bg-white cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const data = new FormData();
                          data.append("file", file);
                          try {
                            const res = await fetch("/api/uploads/gallery", { method: "POST", body: data });
                            if (res.ok) {
                              const result = await res.json();
                              setFormData(p => ({ ...p, galleryImages: [...p.galleryImages, result.url] }));
                            }
                          } catch(err) {
                            alert("Gallery upload failed");
                          }
                        }
                      }}
                    />
                    <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 font-medium">Add Image</span>
                  </label>
                )}
              </div>
            </div>

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
                            newFeatures[idx].icon = iconName;
                            setFormData((p) => ({ ...p, features: newFeatures }));
                          }}
                          availableIcons={availableIcons}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                        <input
                          value={feature.title}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[idx].title = e.target.value;
                            setFormData(p => ({ ...p, features: newFeatures }));
                          }}
                          className="w-full border border-gray-200 rounded-md p-2 bg-white text-sm focus:ring-coral-500 focus:border-coral-500 outline-none"
                          placeholder="e.g. Blazing Fast"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description (Max 150 chars)</label>
                        <input
                          value={feature.description}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[idx].description = e.target.value;
                            setFormData(p => ({ ...p, features: newFeatures }));
                          }}
                          maxLength={150}
                          className="w-full border border-gray-200 rounded-md p-2 bg-white text-sm focus:ring-coral-500 focus:border-coral-500 outline-none"
                          placeholder="Short description of this feature..."
                        />
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
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Tagline:</strong> {formData.tagline}</p>
              <p><strong>Website:</strong> {formData.websiteUrl}</p>
              <p><strong>City:</strong> {formData.city}</p>
              {formData.startupPhone && (
                <p><strong>Phone:</strong> {formData.startupPhone.replace(/^(\+?\d{2}|\d{0})?(\d{3})(\d{3})(\d{4})$/, (_, cc, a, b, c) => `${cc || ""}****${c}`)}</p>
              )}
              {formData.prototypeStatus && (
                <p><strong>Build Stage:</strong> {formData.prototypeStatus}</p>
              )}
              {formData.problemStatement && (
                <p><strong>Problem:</strong> {formData.problemStatement.slice(0, 100)}{formData.problemStatement.length > 100 ? "..." : ""}</p>
              )}
            </div>
          </div>
        )}

        {/* Error banner — fixed min-height so buttons don't jump when it appears/disappears */}
        <div className="mt-5 min-h-[52px]">
          {Object.keys(errors).length > 0 && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                {errors.form ? (
                  <strong className="capitalize">{errors.form.join(", ")}</strong>
                ) : (
                  <>Validation failed for{" "}
                  <strong className="capitalize">{Object.keys(errors).map(k => k === 'logoUrl' ? 'logo' : k).join(", ")}</strong>. Please fix the highlighted fields above.</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Navigation buttons — flex-wrap safe for small screens */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <button
            onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
            disabled={step === 1 || isSaving}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={saveDraft}
              disabled={isSaving || !startupId}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-40 transition-colors"
            >
              {isSaving ? "Saving…" : "Save Draft"}
            </button>
            {step < 6 ? (
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="px-6 py-2.5 bg-coral-500 text-white rounded-xl text-sm font-semibold hover:bg-coral-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSaving ? "Saving…" : "Next"}
              </button>
            ) : (
              <button
                onClick={handleSubmitReview}
                disabled={isSaving}
                className="px-6 py-2.5 bg-coral-500 text-white rounded-xl text-sm font-semibold hover:bg-coral-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSaving ? "Submitting…" : "Submit for Review"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
