"use client";

import { useEffect, useRef } from "react";
import type Quill from "quill";

interface QuillEditorProps {
  value?: unknown; // Quill Delta JSON
  onChange?: (delta: unknown, html: string, text: string) => void;
  imageUploadUrl?: string;
  onUploadStateChange?: (uploading: boolean) => void;
  readOnly?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}

export default function QuillEditor({
  value,
  onChange,
  placeholder = "Write your post content here…",
  className = "",
  imageUploadUrl = "/api/uploads/journal",
  onUploadStateChange,
  readOnly = false,
  ariaLabel = "Journal content",
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const changeRef = useRef(onChange);
  const valueRef = useRef(value);
  const uploadRef = useRef(onUploadStateChange);
  const readOnlyRef = useRef(readOnly);
  useEffect(() => { changeRef.current = onChange; uploadRef.current = onUploadStateChange; }, [onChange, onUploadStateChange]);
  useEffect(() => {
    valueRef.current = value;
    const q = quillRef.current;
    const next = value ?? { ops: [{ insert: "\n" }] };
    if (q && JSON.stringify(q.getContents()) !== JSON.stringify(next)) {
      try { q.setContents(next as Parameters<Quill["setContents"]>[0], "silent"); } catch { /* Keep current content if a caller supplies an invalid Delta. */ }
    }
  }, [value]);
  useEffect(() => {
    readOnlyRef.current = readOnly;
    const q = quillRef.current;
    q?.enable(!readOnly);
    editorRef.current?.querySelectorAll<HTMLButtonElement | HTMLSelectElement>(".ql-toolbar button, .ql-toolbar select").forEach(control => { control.disabled = readOnly; });
  }, [readOnly]);

  useEffect(() => {
    const host = editorRef.current;
    if (!host) return;
    let cancelled = false;
    let quillInstance: Quill | undefined;
    let changed: (() => void) | undefined;

    (async () => {
      const Quill = (await import("quill")).default;

      // Import Quill CSS
      await import("quill/dist/quill.snow.css");
      if (cancelled) return;
      const canvas = document.createElement("div");
      host.replaceChildren(canvas);

      const toolbarOptions = [
        [{ header: [2, 3, 4, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "video"],
        ["clean"],
      ];

      quillInstance = new Quill(canvas, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: {
            container: toolbarOptions,
            handlers: {
              image: function () {
                if (readOnlyRef.current) return;
                const input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", "image/png,image/jpeg,image/webp,image/gif");
                input.click();

                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;

                  uploadRef.current?.(true);
                  try {
                    const data = new FormData(); data.append("file", file);
                    const response = await fetch(imageUploadUrl, { method: "POST", body: data });
                    const result = await response.json();
                    if (!response.ok || !result.url) throw new Error(result.error || "Image upload failed. Please try again.");
                    if (cancelled || !quillInstance) return;
                    const range = quillInstance.getSelection(true);
                    quillInstance.insertEmbed(range.index, "image", result.url);
                    quillInstance.setSelection(range.index + 1);
                  } catch (error) {
                    if (!cancelled) alert(error instanceof Error ? error.message : "Image upload failed. Please try again.");
                  } finally { if (!cancelled) uploadRef.current?.(false); }
                };
              },
            },
          },
        },
      });

      quillRef.current = quillInstance;
      const q = quillInstance;
      q.root.setAttribute("role", "textbox");
      q.root.setAttribute("aria-label", ariaLabel);
      q.root.setAttribute("aria-multiline", "true");
      q.enable(!readOnlyRef.current);

      // Set initial content if provided
      if (valueRef.current) {
        try {
          q.setContents(valueRef.current as Parameters<Quill["setContents"]>[0]);
        } catch {
          // ignore invalid delta
        }
      }

      // Listen for changes
      changed = () => {
        const delta = q.getContents();
        changeRef.current?.(delta, q.root.innerHTML, q.getText());
      };
      q.on("text-change", changed);
    })();

    return () => {
      cancelled = true;
      if (quillInstance && changed) quillInstance.off("text-change", changed);
      quillInstance?.disable();
      quillRef.current = null;
      host.replaceChildren();
    };
  }, [imageUploadUrl, placeholder, ariaLabel]);

  return (
    <div className={`quill-wrapper ${className}`}>
      <div ref={editorRef} style={{ minHeight: "400px" }} />
      <style>{`
        .quill-wrapper .ql-toolbar {
          border: 1px solid #e5e7eb;
          border-bottom: none;
          border-radius: 8px 8px 0 0;
          background: #f9fafb;
          font-family: inherit;
        }
        .quill-wrapper .ql-container {
          border: 1px solid #e5e7eb;
          border-radius: 0 0 8px 8px;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.75;
        }
        .quill-wrapper .ql-editor {
          min-height: 400px;
          padding: 1rem 1.25rem;
          color: #111827;
        }
        .quill-wrapper .ql-editor h2 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
        .quill-wrapper .ql-editor h3 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
        .quill-wrapper .ql-editor h4 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .quill-wrapper .ql-editor p { margin-bottom: 0.75rem; }
        .quill-wrapper .ql-editor blockquote {
          border-left: 4px solid #e5e7eb;
          margin: 1rem 0;
          padding: 0.5rem 1rem;
          color: #6b7280;
          font-style: italic;
        }
        .quill-wrapper .ql-editor pre.ql-syntax {
          background: #1e293b;
          color: #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
          font-size: 0.875rem;
          overflow-x: auto;
        }
        .quill-wrapper .ql-editor img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}
