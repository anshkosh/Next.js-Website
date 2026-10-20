import sanitizeHtml from "sanitize-html";

export function sanitizeJournalHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ["p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "sup", "sub", "blockquote", "pre", "code", "ol", "ul", "li", "a", "img", "span", "div", "hr", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height"], li: ["data-list"], "*": ["class"] },
    allowedClasses: { "*": [/^ql-(?:align-(?:center|right|justify)|indent-[1-8]|direction-rtl|size-(?:small|large|huge)|syntax|ui|code-block(?:-container)?)$/] },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attrs) => ({ tagName, attribs: { ...attrs, rel: "noopener noreferrer", ...(attrs.target ? { target: "_blank" } : {}) } }),
    },
  });
}

export function showJournalExcerpt(excerpt: string | null, html: string | null): boolean {
  if (!excerpt?.trim()) return false;
  const firstParagraph = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(html || "")?.[1] || "";
  const text = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
  return !text(firstParagraph).startsWith(text(excerpt));
}

export function publicJournalHtml(value: string): string {
  // Enhance only sanitized output. Never rewrite the stored editor document.
  const clean = sanitizeJournalHtml(value)
    .replace(/<sup>([\s\S]*?)<\/sup>/g, (original, content: string) => {
      const links = content.match(/<a\b[^>]*>\[\d+\]<\/a>/g);
      if (!links || content.replace(/<a\b[^>]*>\[\d+\]<\/a>/g, "").trim()) return original;
      return `<sup>${links.sort((a, b) => Number(/>\[(\d+)\]<\/a>$/.exec(a)?.[1]) - Number(/>\[(\d+)\]<\/a>$/.exec(b)?.[1])).join(" ")}</sup>`;
    });
  let inLink = false;
  return clean.replace(/<\/?a\b[^>]*>|<img\b[^>]*>/g, tag => {
    if (/^<a\b/.test(tag)) { inLink = true; return tag; }
    if (/^<\/a\b/.test(tag)) { inLink = false; return tag; }
    const src = /\bsrc="([^"]+)"/.exec(tag)?.[1];
    return src && !inLink ? `${tag}<a href="${src}" target="_blank" rel="noopener noreferrer">Open full-size image</a>` : tag;
  });
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
