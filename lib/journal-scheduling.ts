export function istDateTimeInput(date: Date | string) {
  return new Date(new Date(date).getTime() + 330 * 60000).toISOString().slice(0, 16);
}
export function parseJournalSchedule(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error("Choose a valid date and time in IST.");
  const date = new Date(`${value}:00+05:30`);
  if (!Number.isFinite(date.getTime()) || istDateTimeInput(date) !== value) throw new Error("Choose a valid date and time in IST.");
  if (date <= now) throw new Error("Choose a future publication time in IST.");
  if (date.getTime() - now.getTime() > 2 * 366 * 86400000) throw new Error("Choose a publication time within the next two years.");
  return date;
}
