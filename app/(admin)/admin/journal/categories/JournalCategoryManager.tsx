"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import {
  createJournalCategory,
  updateJournalCategory,
  deleteJournalCategory,
} from "@/app/actions/journal.actions";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  postCount: number;
}

interface Props {
  initialCategories: Category[];
}

export default function JournalCategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) { setError("Name is required"); return; }
    setError("");
    startTransition(async () => {
      const result = await createJournalCategory({ name: newName, description: newDesc });
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setShowAddForm(false);
        setNewName(""); setNewDesc("");
        // Refresh — simple approach
        window.location.reload();
      }
    });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) { setError("Name is required"); return; }
    setError("");
    startTransition(async () => {
      const result = await updateJournalCategory(id, { name: editName, description: editDesc });
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName, description: editDesc } : c));
        setEditingId(null);
      }
    });
  };

  const handleDelete = (id: string, postCount: number) => {
    if (postCount > 0) {
      alert(`Cannot delete — ${postCount} post${postCount > 1 ? "s are" : " is"} using this category. Reassign them first.`);
      return;
    }
    if (!confirm("Delete this category?")) return;
    startTransition(async () => {
      const result = await deleteJournalCategory(id);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Add new category */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-coral-600 text-white rounded-md text-sm font-medium hover:bg-coral-700 transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">New Category</h3>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Category name"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40"
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-coral-600 text-white rounded-md text-sm font-medium hover:bg-coral-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Create
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewName(""); setNewDesc(""); setError(""); }}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            No categories yet. Create your first one above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map(cat => (
              <li key={cat.id} className="px-4 py-3">
                {editingId === cat.id ? (
                  <div className="space-y-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40"
                    />
                    <input
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(cat.id)}
                        disabled={isPending}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 border border-gray-200 rounded-md text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500">
                        /{cat.slug} · {cat.postCount} post{cat.postCount !== 1 ? "s" : ""}
                        {cat.description && ` · ${cat.description}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                          setEditDesc(cat.description);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-md"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.postCount)}
                        className="p-1.5 text-red-400 hover:text-red-600 bg-red-50 rounded-md"
                        title="Delete"
                        disabled={isPending}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
