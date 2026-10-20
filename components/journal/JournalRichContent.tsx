import { createElement, type ReactNode } from "react";
import { journalDeltaSchema, safeJournalLink, safeJournalVideo } from "@/lib/journal-rich-text";

export default function JournalRichContent({ content, fallback }: { content?: unknown; fallback: string }) {
  const parsed = journalDeltaSchema.safeParse(content);
  if (!parsed.success) return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">{fallback}</p>;
  type Attrs = NonNullable<(typeof parsed.data.ops)[number]["attributes"]>;
  const lines: { children: ReactNode[]; attributes: Attrs }[] = [];
  let current: ReactNode[] = [];
  let key = 0;
  for (const op of parsed.data.ops) {
    const attrs = op.attributes ?? {};
    if (typeof op.insert !== "string") {
      if ("image" in op.insert) {
        // Next image optimization would cache private bytes; use the protected route directly.
        // eslint-disable-next-line @next/next/no-img-element
        current.push(<img key={key++} src={op.insert.image} alt="Journal image" loading="lazy" className="my-4 max-h-[600px] max-w-full rounded-lg object-contain" />);
      } else if (safeJournalVideo(op.insert.video)) {
        const src = op.insert.video.replace("https://www.youtube.com/", "https://www.youtube-nocookie.com/");
        current.push(<iframe key={key++} src={src} title="Journal video" loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-presentation" allowFullScreen className="my-4 aspect-video w-full rounded-lg border-0" />);
      }
      continue;
    }
    const parts = op.insert.split("\n");
    parts.forEach((part, index) => {
      if (part) {
        let node: ReactNode = part;
        if (attrs.bold) node = <strong>{node}</strong>;
        if (attrs.italic) node = <em>{node}</em>;
        if (attrs.underline) node = <u>{node}</u>;
        if (attrs.strike) node = <s>{node}</s>;
        if (attrs.link && safeJournalLink(attrs.link)) node = <a href={attrs.link} target="_blank" rel="ugc noopener noreferrer" className="text-coral-700 underline">{node}</a>;
        current.push(<span key={key++}>{node}</span>);
      }
      if (index < parts.length - 1) { lines.push({ children: current, attributes: attrs }); current = []; }
    });
  }
  if (current.length) lines.push({ children: current, attributes: {} });
  const blocks: ReactNode[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.attributes.list) {
      const style = line.attributes.list;
      const items: ReactNode[] = [];
      do { items.push(<li key={index}>{lines[index].children}</li>); index++; } while (index < lines.length && lines[index].attributes.list === style);
      index--;
      blocks.push(createElement(style === "ordered" ? "ol" : "ul", { key: `list-${index}`, className: `my-3 space-y-1 pl-6 ${style === "ordered" ? "list-decimal" : "list-disc"}` }, items));
    } else if (line.attributes.header) {
      blocks.push(createElement(`h${Math.max(2, line.attributes.header)}`, { key: index, className: "mb-2 mt-5 font-heading text-xl font-bold text-gray-900" }, line.children));
    } else if (line.attributes.blockquote) {
      blocks.push(<blockquote key={index} className="my-3 border-l-4 border-coral-200 pl-4 italic text-gray-600">{line.children}</blockquote>);
    } else if (line.attributes["code-block"]) {
      blocks.push(<pre key={index} className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-sm text-slate-100"><code>{line.children}</code></pre>);
    } else {
      blocks.push(<div key={index} className="mb-3 min-h-5 whitespace-pre-wrap">{line.children}</div>);
    }
  }
  return <div className="min-w-0 break-words text-sm leading-relaxed text-gray-700">{blocks}</div>;
}
