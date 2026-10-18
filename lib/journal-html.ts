import sanitizeHtml from "sanitize-html";

export function sanitizeJournalHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ["p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "blockquote", "pre", "code", "ol", "ul", "li", "a", "img", "span", "div", "hr", "table", "thead", "tbody", "tr", "th", "td"],
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

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
