const journalDate = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Public Journal dates follow India's calendar regardless of the render host. */
export function formatJournalDate(date: Date): string {
  return journalDate.format(date);
}
