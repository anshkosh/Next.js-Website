"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  Upload, X, Plus, ChevronDown, ChevronUp, Loader2,
  Eye, EyeOff, Save, Trash2, Globe
} from "lucide-react";
import { createJournalPost, updateJournalPost, publishJournalPost, unpublishJournalPost, deleteJournalPost } from "@/app/actions/journal.actions";

const QuillEditor = dynamic(() => import("./QuillEditor"), { ssr: false, loading: () => (
  <div className="border border-gray-200 rounded-lg flex items-center justify-center min-h-[400px] bg-gray-50">
    <Loader2 className="animate-spin text-gray-400" size={32} />
  </div>
)});

interface Category { id: string; name: string; }

interface JournalPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  authorName: string;
  coverImageUrl?: string | null;
  contentJson?: unknown;
  contentHtml?: string | null;
  status: "DRAFT" | "PUBLISHED";
  isFeatured: boolean;
  tags: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords: string[];
  canonicalUrl?: string | null;
  categoryId?: string | null;
}

interface JournalFormProps {
  categories: Category[];
  post?: JournalPost;
}

export default function JournalForm({ categories, post }: JournalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!post?.slug);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [authorName, setAuthorName] = useState(post?.authorName ?? "Anshkosh Team");
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured ?? false);
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [coverUploading, setCoverUploading] = useState(false);

  // Content
  const [contentJson, setContentJson] = useState<unknown>(post?.contentJson ?? null);
  const [contentHtml, setContentHtml] = useState(post?.contentHtml ?? "");

  // SEO
  const [seoOpen, setSeoOpen] = useState(false);
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [metaKeywords, setMetaKeywords] = useState<string[]>(post?.metaKeywords ?? []);
  const [metaKeywordInput, setMetaKeywordInput] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) {
      setSlug(val.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, ""));
    }
  };

  // Cover image upload
  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/uploads/journal", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setCoverImageUrl(data.url);
      else setError(data.error ?? "Upload failed");
    } catch {
      setError("Cover image upload failed");
    } finally {
      setCoverUploading(false);
    }
  }, []);

  const addTag = (val: string) => {
    const t = val.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
  };

  const addMetaKeyword = (val: string) => {
    const k = val.trim().toLowerCase();
    if (k && !metaKeywords.includes(k)) setMetaKeywords(prev => [...prev, k]);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("slug", slug);
    fd.append("excerpt", excerpt);
    fd.append("authorName", authorName);
    fd.append("coverImageUrl", coverImageUrl);
    fd.append("categoryId", categoryId);
    fd.append("isFeatured", String(isFeatured));
    fd.append("tags", JSON.stringify(tags));
    fd.append("contentJson", JSON.stringify(contentJson));
    fd.append("contentHtml", contentHtml);
    fd.append("metaTitle", metaTitle);
    fd.append("metaDescription", metaDescription);
    fd.append("metaKeywords", JSON.stringify(metaKeywords));
    fd.append("canonicalUrl", canonicalUrl);
    return fd;
  };

  const handleSaveDraft = () => {
    setError(""); setSuccessMsg("");
    startTransition(async () => {
      const fd = buildFormData();
      const result = post
        ? await updateJournalPost(post.id, fd)
        : await createJournalPost(fd);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSuccessMsg("Saved as draft");
        if (!post && "id" in result) {
          router.push(`/admin/journal/${result.id as string}/edit`);
        }
      }
    });
  };

  const handlePublish = () => {
    setError(""); setSuccessMsg("");
    startTransition(async () => {
      if (!post) {
        // Create first, then publish
        const fd = buildFormData();
        const createResult = await createJournalPost(fd);
        if ("error" in createResult && createResult.error) {
          setError(createResult.error); return;
        }
        if ("id" in createResult) {
          const newId = createResult.id as string;
          const pubResult = await publishJournalPost(newId);
          if ("error" in pubResult && pubResult.error) {
            setError(pubResult.error); return;
          }
          setSuccessMsg("Post published!");
          router.push(`/admin/journal/${newId}/edit`);
        }
      } else {
        const fd = buildFormData();
        const updateResult = await updateJournalPost(post.id, fd);
        if ("error" in updateResult && updateResult.error) {
          setError(updateResult.error); return;
        }
        const pubResult = await publishJournalPost(post.id);
        if ("error" in pubResult && pubResult.error) {
          setError(pubResult.error); return;
        }
        setSuccessMsg("Post published!");
      }
    });
  };

  const handleUnpublish = () => {
    if (!post) return;
    setError(""); setSuccessMsg("");
    startTransition(async () => {
      const result = await unpublishJournalPost(post.id);
      if ("error" in result && result.error) setError(result.error);
      else setSuccessMsg("Reverted to draft");
    });
  };

  const handleDelete = () => {
    if (!post) return;
    if (!confirm("Delete this post permanently?")) return;
    startTransition(async () => {
      const result = await deleteJournalPost(post.id);
      if ("error" in result && result.error) setError(result.error);
      else router.push("/admin/journal");
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">
          {post ? "Edit Post" : "New Post"}
        </h1>
        <div className="flex items-center gap-2">
          {post && (
            <button onClick={handleDelete} disabled={isPending}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition-colors">
              <Trash2 size={16} /> Delete
            </button>
          )}
          <button onClick={handleSaveDraft} disabled={isPending}
            className="flex items-center gap-1 px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </button>
          {post?.status === "PUBLISHED" ? (
            <button onClick={handleUnpublish} disabled={isPending}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-medium">
              <EyeOff size={16} /> Unpublish
            </button>
          ) : (
            <button onClick={handlePublish} disabled={isPending}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-coral-500 text-white rounded-md hover:bg-coral-600 transition-colors font-medium">
              <Eye size={16} /> Publish
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">{successMsg}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* ===== LEFT: Main Content ===== */}
        <div className="space-y-6">
          {/* Title */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Your post title"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-lg font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/40 focus:border-coral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 shrink-0">/journal/</span>
                <input
                  value={slug}
                  onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                  placeholder="post-url-slug"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-coral-500/40 focus:border-coral-500"
                />
              </div>
            </div>
          </div>

          {/* Quill Editor */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
            <QuillEditor
              value={contentJson}
              onChange={(delta, html) => {
                setContentJson(delta);
                setContentHtml(html);
              }}
            />
          </div>

          {/* Excerpt */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Excerpt <span className="text-gray-400 font-normal">(optional)</span></label>
            <p className="text-xs text-gray-500 mb-2">Short summary for cards and meta descriptions. Auto-generated from content if left empty.</p>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Brief summary of the post…"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40 focus:border-coral-500 resize-y"
            />
          </div>
        </div>

        {/* ===== RIGHT: Sidebar ===== */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
            <div className="flex items-center gap-2">
              {post?.status === "PUBLISHED" ? (
                <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">PUBLISHED</span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold">DRAFT</span>
              )}
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cover Image</h3>
            {coverImageUrl ? (
              <div className="relative">
                <Image src={coverImageUrl} alt="Cover" width={280} height={157} className="w-full aspect-video object-cover rounded-md" />
                <button onClick={() => setCoverImageUrl("")}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors text-gray-400">
                {coverUploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                <span className="text-sm">{coverUploading ? "Uploading…" : "Click to upload cover image"}</span>
                <span className="text-xs">PNG, JPEG, WEBP · Max 5MB</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleCoverUpload} disabled={coverUploading} />
              </label>
            )}
          </div>

          {/* Category */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Category</h3>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40"
            >
              <option value="">Uncategorized</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <a href="/admin/journal/categories" className="mt-2 text-xs text-coral-500 hover:text-coral-600 inline-block">
              Manage categories →
            </a>
          </div>

          {/* Author */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Author</h3>
            <input
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Author name"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40"
            />
          </div>

          {/* Tags */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {tag}
                  <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput("");
                  }
                }}
                placeholder="Add tag, press Enter"
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40"
              />
              <button onClick={() => { addTag(tagInput); setTagInput(""); }}
                className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Featured */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                <div className={`w-10 h-6 rounded-full transition-colors ${isFeatured ? "bg-coral-500" : "bg-gray-200"}`} />
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFeatured ? "translate-x-4" : ""}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Featured Post</p>
                <p className="text-xs text-gray-400">Highlight on the journal listing page</p>
              </div>
            </label>
          </div>

          {/* SEO (collapsible) */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setSeoOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2"><Globe size={16} /> SEO Settings</span>
              {seoOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {seoOpen && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Title</label>
                  <input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="SEO meta title"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Description</label>
                  <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)}
                    placeholder="SEO meta description…" rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Meta Keywords</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {metaKeywords.map(kw => (
                      <span key={kw} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {kw}
                        <button onClick={() => setMetaKeywords(prev => prev.filter(k => k !== kw))}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input value={metaKeywordInput} onChange={e => setMetaKeywordInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addMetaKeyword(metaKeywordInput);
                        setMetaKeywordInput("");
                      }
                    }}
                    placeholder="Type and press Enter to add keywords…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/40" />
                  <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add. Backspace to remove last.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Canonical URL</label>
                  <input value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} placeholder="https://…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-coral-500/40" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
