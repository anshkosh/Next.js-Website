const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
export function characterCount(value: string) {
  return Array.from(segmenter.segment(value)).length;
}
export function limitCharacters(value: string, max: number) {
  return Array.from(segmenter.segment(value)).slice(0, max).map(part => part.segment).join("");
}
