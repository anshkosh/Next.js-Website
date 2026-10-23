"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Trash2, UploadCloud, X, Check, Image as ImageIcon, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { getUpdates, createUpdate, editUpdate, deleteUpdate } from "@/app/actions/update.actions";
import Image from "next/image";

type Update = {
  status?: string;
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function timeAgo(dateStr: Date | string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function UpdateManager({ startupId }: { startupId: string }) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null); // "new" | update id | null
  const [isSaving, setIsSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [status, setStatus] = useState("");
  const [saveError, setSaveError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    imageUrl: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadUpdates = useCallback(async () => {
    try {
      const res = await getUpdates(startupId);
      if (res.data) { setUpdates(res.data); setLoadError(null); }
      else setLoadError(res.error || "Unable to load updates.");
    } catch { setLoadError("Unable to load updates. Please try again."); }
    finally { setIsLoading(false); }
  }, [startupId]);

  useEffect(() => {
    let active = true;
    getUpdates(startupId).then(res => {
      if (!active) return;
      if (res.data) { setUpdates(res.data); setLoadError(null); }
      else setLoadError(res.error || "Unable to load updates.");
      setIsLoading(false);
    }).catch(() => {
      if (active) { setLoadError("Unable to load updates. Please try again."); setIsLoading(false); }
    });
    return () => { active = false; };
  }, [startupId]);

  const uploadImage = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setImageError(false);
    setIsUploading(true);

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/uploads/update-image", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      } else {
        alert("Upload failed.");
        setImagePreview("");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error.");
      setImagePreview("");
    } finally {
      setIsUploading(false);
    }
  };

  const startAdd = () => {
    setStatus(""); setSaveError("");
    setFormData({ title: "", body: "", imageUrl: "" });
    setImagePreview("");
    setImageError(false);
    setIsEditing("new");
  };

  const startEdit = (update: Update) => {
    setStatus(""); setSaveError("");
    setFormData({
      title: update.title,
      body: update.body,
      imageUrl: update.imageUrl || "",
    });
    setImagePreview("");
    setImageError(false);
    setIsEditing(update.id);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setStatus(""); setSaveError("");
    if (formData.title.trim().length < 3) {
      setSaveError("Title needs at least 3 characters.");
      return;
    }
    if (!formData.body.trim() || formData.body.trim().length < 10) {
      setSaveError("Body needs at least 10 characters.");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing === "new") {
        const res = await createUpdate({
          startupId,
          title: formData.title.trim(),
          body: formData.body.trim(),
          imageUrl: formData.imageUrl || undefined,
        });
        if (res.error) {
          setSaveError(res.error);
        } else if (res.data) {
          setUpdates([res.data as Update, ...updates]);
          setIsEditing(null);
          setStatus("Update saved for moderation. It will appear publicly after approval.");
        }
      } else if (isEditing) {
        const res = await editUpdate(isEditing, {
          title: formData.title.trim(),
          body: formData.body.trim(),
          imageUrl: formData.imageUrl || undefined,
        });
        if (res.error) {
          setSaveError(res.error);
        } else if (res.data) {
          setUpdates(updates.map((u) => (u.id === isEditing ? (res.data as Update) : u)));
          setIsEditing(null);
          setStatus("Changes saved for moderation. This update is hidden publicly until approved.");
        }
      }

    } catch {
      setSaveError("Could not confirm the save. Your text is still here; check your updates before trying again.");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this update? This action cannot be undone.")) return;

    setIsSaving(true);
    const res = await deleteUpdate(id);
    if (res.error) {
      alert(res.error);
    } else {
      setUpdates(updates.filter((u) => u.id !== id));
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-coral-500" />
      </div>
    );
  }

  const displayedUpdates = showAll ? updates : updates.slice(0, 5);

  return (
    <div className="space-y-6">
      {status && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{status}</p>}
      {saveError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
      {loadError && <p role="alert" className="text-sm text-red-600">{loadError} <button type="button" onClick={() => void loadUpdates()} className="underline">Retry</button></p>}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Founder Updates</h3>
          <p className="text-gray-500 text-sm">Share progress, milestones, and news with your audience.</p>
        </div>
        {updates.length > 0 && (
          <span className="text-sm font-medium text-gray-500">{updates.length} update{updates.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Update List */}
      {updates.length > 0 && !isEditing && (
        <div className="space-y-3">
          {displayedUpdates.map((update, idx) => (
            <div key={update.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral-100 text-coral-600 text-xs font-bold shrink-0">
                      {updates.length - (showAll ? idx : idx)}
                    </span>
                    <h4 className="font-semibold text-gray-900 truncate">{update.title}</h4>
                    {update.status && update.status !== "APPROVED" && <span className="text-xs font-semibold text-amber-900">{update.status === "REJECTED" ? "Changes needed" : "Awaiting moderation"}</span>}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 ml-8">{update.body}</p>
                  {update.imageUrl && (
                    <div className="ml-8 mt-2">
                      <Image unoptimized width={80} height={56} src={update.imageUrl} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2 ml-8">{timeAgo(update.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(update)}
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md transition-colors"
                    title="Edit update"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(update.id)}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete update"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {updates.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm font-medium text-gray-500 hover:text-coral-500 flex items-center justify-center gap-1 transition-colors"
            >
              {showAll ? (
                <>Show Less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Show All ({updates.length}) <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Form */}
      {isEditing ? (
        <div className="border border-gray-200 p-6 rounded-xl bg-gray-50/50 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {isEditing === "new" ? "Post an Update" : "Edit Update"}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-coral-500 focus:border-coral-500 outline-none transition-shadow"
              placeholder="e.g. We just hit 1000 users!"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{formData.title.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-coral-500 focus:border-coral-500 outline-none transition-shadow min-h-[120px] resize-y"
              placeholder="Share what's new with your startup..."
              maxLength={5000}
              rows={5}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{formData.body.length}/5000</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image (optional)</label>
            {formData.imageUrl || imagePreview ? (
              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl bg-white">
                {!imageError ? (
                  <Image unoptimized width={80} height={56}
                    src={imagePreview || formData.imageUrl}
                    alt="Preview"
                    onError={() => setImageError(true)}
                    className="w-20 h-14 object-cover rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-14 flex items-center justify-center rounded-lg border bg-gray-100 text-gray-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-500" /> Image uploaded
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, imageUrl: "" });
                    setImagePreview("");
                    setImageError(false);
                  }}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white">
                <Loader2 className="w-6 h-6 text-coral-500 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Uploading...</p>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-coral-400 rounded-xl p-6 bg-white cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                  className="hidden"
                />
                <UploadCloud className="w-6 h-6 text-gray-500 mb-2" />
                <p className="text-sm font-medium text-gray-700">Click to upload an image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP, GIF — max 5MB</p>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              onClick={() => setIsEditing(null)}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              className="px-4 py-2 text-sm font-medium bg-coral-600 text-white rounded-lg hover:bg-coral-700 disabled:opacity-50 transition-colors"
            >
              {isSaving
                ? "Saving..."
                : isEditing === "new"
                  ? "Submit update"
                  : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startAdd}
          className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-coral-400 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-coral-500 hover:bg-coral-50/50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Post a New Update</span>
        </button>
      )}
    </div>
  );
}
