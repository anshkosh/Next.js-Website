/** Estimate from article text only, using the editor's 200-word-per-minute policy.
 * @param {string | null | undefined} html
 * @returns {number}
 */
export function calculateReadingTime(html) {
  const text = (html || "")
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi, " ")
    .replace(/<\/?(?:p|div|h[1-6]|li|ul|ol|blockquote|section|article|br|hr|tr|td|th)\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, value) => {
      const code = value[0].toLowerCase() === "x" ? parseInt(value.slice(1), 16) : parseInt(value, 10);
      return code <= 0x10ffff ? String.fromCodePoint(code) : " ";
    })
    .replace(/&(nbsp|ensp|emsp|thinsp|amp|lt|gt|quot|apos|rsquo|lsquo|mdash|ndash);/gi, (_, entity) => {
      return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", rsquo: "’", lsquo: "‘", mdash: "—", ndash: "–" })[entity.toLowerCase()] || " ";
    });
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:[’'-][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*/gu)?.length || 0;
  return Math.max(1, Math.ceil(words / 200));
}
