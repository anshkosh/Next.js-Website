"use client";

import EditableImageUpload from "./EditableImageUpload";
import { useUploadActivity } from "./useUploadActivity";
import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getFounders, createFounder, updateFounder, deleteFounder } from "@/app/actions/founder.actions";

type Founder = {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
};

export default function FounderManager({ startupId, onBusyChange }: { startupId: string; onBusyChange?: (busy: boolean) => void }) {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(startupId));
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for current edit/add
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    linkedinUrl: "",
    twitterUrl: "",
    photoUrl: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  useUploadActivity(isUploading || isSaving, onBusyChange);

  useEffect(() => {
    if (!startupId) return;
    let alive = true;
    getFounders(startupId).then(res => {
      if (!alive) return;
      if (res.data) setFounders(res.data);
      setIsLoading(false);
    }).catch(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
  }, [startupId]);

  const startAdd = () => {
    setFormData({ name: "", role: "", linkedinUrl: "", twitterUrl: "", photoUrl: "" });
    setIsEditing("new");
  };

  const startEdit = (founder: Founder) => {
    setFormData({
      name: founder.name,
      role: founder.role || "",
      linkedinUrl: founder.linkedinUrl || "",
      twitterUrl: founder.twitterUrl || "",
      photoUrl: founder.photoUrl || "",
    });
    setIsEditing(founder.id);
  };

  const handleSave = async () => {
    if (isUploading || isSaving) return;
    if (!formData.name.trim()) {
      alert("Name is required");
      return;
    }

    setIsSaving(true);
    if (isEditing === "new") {
      const res = await createFounder({
        startupId,
        ...formData,
      });
      if (res.error) alert(res.error);
      else {
        setFounders([...founders, res.data as Founder]);
        setIsEditing(null);
      }
    } else if (isEditing) {
      const res = await updateFounder(isEditing, formData);
      if (res.error) alert(res.error);
      else {
        setFounders(founders.map((f) => (f.id === isEditing ? (res.data as Founder) : f)));
        setIsEditing(null);
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this founder?")) return;
    
    setIsSaving(true);
    const res = await deleteFounder(id);
    if (res.error) alert(res.error);
    else {
      setFounders(founders.filter((f) => f.id !== id));
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-coral-500" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Step 3: Founders</h2>
      <p className="text-gray-500 text-sm">Add up to 3 founders to your startup profile.</p>

      {/* List of Founders */}
      {founders.length > 0 && !isEditing && (
        <div className="space-y-4">
          {founders.map((founder) => (
            <div key={founder.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="flex items-center gap-4">
                {founder.photoUrl ? (
                  <img src={founder.photoUrl} alt={founder.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                    {founder.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{founder.name}</h4>
                  <p className="text-sm text-gray-500">{founder.role || "Founder"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => startEdit(founder)} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(founder.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form */}
      {isEditing ? (
        <div className="border border-gray-200 p-6 rounded-xl bg-gray-50/50 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-4">{isEditing === "new" ? "Add Founder" : "Edit Founder"}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded-md p-2 bg-white" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full border rounded-md p-2 bg-white" placeholder="CEO, Technical Founder, etc." />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input type="url" value={formData.linkedinUrl} onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})} className="w-full border rounded-md p-2 bg-white" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
              <input type="url" value={formData.twitterUrl} onChange={(e) => setFormData({...formData, twitterUrl: e.target.value})} className="w-full border rounded-md p-2 bg-white" placeholder="https://twitter.com/..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
            <EditableImageUpload kind="founder-photo" label="Founder photo" value={formData.photoUrl} onChange={url => setFormData(previous => ({ ...previous, photoUrl: url }))} onBusyChange={setIsUploading} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={() => setIsEditing(null)} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50">Cancel</button>
            <button type="button" onClick={handleSave} disabled={isSaving || isUploading} className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50">
              {isSaving ? "Saving..." : "Save Founder"}
            </button>
          </div>
        </div>
      ) : (
        founders.length < 3 && (
          <button type="button" onClick={startAdd} className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-coral-400 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-coral-500 hover:bg-coral-50/50 transition-all">
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add another founder</span>
          </button>
        )
      )}
    </div>
  );
}
