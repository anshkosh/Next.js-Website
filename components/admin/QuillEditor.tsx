"use client";

import { useEffect, useRef, useCallback } from "react";

interface QuillEditorProps {
  value?: unknown; // Quill Delta JSON
  onChange?: (delta: unknown, html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function QuillEditor({
  value,
  onChange,
  placeholder = "Write your post content here…",
  className = "",
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quillRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const uploadImageToR2 = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/uploads/journal", { method: "POST", body: formData });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current || !editorRef.current) return;
    initializedRef.current = true;

    let quillInstance: unknown;

    (async () => {
      const Quill = (await import("quill")).default;

      // Import Quill CSS
      await import("quill/dist/quill.snow.css");

      const toolbarOptions = [
        [{ header: [2, 3, 4, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image", "video"],
        ["clean"],
      ];

      quillInstance = new Quill(editorRef.current!, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: {
            container: toolbarOptions,
            handlers: {
              image: function () {
                const input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", "image/png,image/jpeg,image/webp,image/gif");
                input.click();

                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;

                  const url = await uploadImageToR2(file);
                  if (!url) {
                    alert("Image upload failed. Please try again.");
                    return;
                  }

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const q = quillInstance as any;
                  const range = q.getSelection(true);
                  q.insertEmbed(range.index, "image", url);
                  q.setSelection(range.index + 1);
                };
              },
            },
          },
        },
      });

      quillRef.current = quillInstance;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = quillInstance as any;

      // Set initial content if provided
      if (value) {
        try {
          q.setContents(value);
        } catch {
          // ignore invalid delta
        }
      }

      // Listen for changes
      q.on("text-change", () => {
        const delta = q.getContents();
        const html = editorRef.current?.querySelector(".ql-editor")?.innerHTML ?? "";
        onChange?.(delta, html);
      });
    })();

    return () => {
      // Quill v2 doesn't have a destroy() API, just clean up the DOM
      quillRef.current = null;
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
