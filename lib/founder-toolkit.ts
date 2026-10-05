import { LAUNCH_DIRECTORIES, safeLaunchUrl, type LaunchKitData } from "./launch-resources";

export const FOUNDER_TOOLS = [
  { id: "validation", title: "Customer validation planner", group: "Think it through", description: "Plan customer conversations and record what you actually learn.", result: "An interview plan + evidence notes" },
  { id: "mvp", title: "MVP Scope Cutter", group: "Think it through", description: "Choose the smallest version that tests your main promise.", result: "A focused first-build plan" },
  { id: "runway", title: "Runway calculator", group: "Think it through", description: "Explore how cash, monthly costs and revenue affect your runway.", result: "Cash scenarios in rupees" },
  { id: "pitch", title: "Startup pitch builder", group: "Make it clear", description: "Turn your audience, problem and approach into reusable launch copy.", result: "A pitch + introduction + announcement" },
  { id: "launch-card", title: "Launch card maker", group: "Make it clear", description: "Make a social graphic with your logo, tagline and startup link.", result: "A downloadable PNG graphic" },
  { id: "kit", title: "Reusable launch kit", group: "Make it clear", description: "Keep your description, team introduction and launch materials together.", result: "A complete text kit" },
  { id: "checklist", title: "Launch checklist", group: "Get ready to launch", description: "Work through your evidence, website, materials and launch channels.", result: "Progress you can come back to" },
  { id: "directories", title: "Directory catalogue", group: "Get ready to launch", description: "Check audience, eligibility and external fees before submitting.", result: "Official links + submission requirements" },
  { id: "tracker", title: "Directory submission tracker", group: "Get ready to launch", description: "Keep your submissions, listing links and follow-up dates in one place.", result: "A submission log + CSV export" },
] as const;

export type FounderDetails = {
  name: string; tagline: string; audience: string; problem: string;
  approach: string; outcome: string; websiteUrl: string; stage: string;
};
export const EMPTY_FOUNDER: FounderDetails = { name: "", tagline: "", audience: "", problem: "", approach: "", outcome: "", websiteUrl: "", stage: "" };
export const FOUNDER_KEY = "anshkosh-founder-details-v1";
export const KIT_KEY = "anshkosh-founder-kit-v1";
export const EMPTY_KIT: LaunchKitData = { name: "", tagline: "", description: "", websiteUrl: "", audience: "", stage: "", evidence: "", team: "", assets: [] };

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function parseRecord(raw: string): Record<string, unknown> {
  try { return record(JSON.parse(raw)); } catch { return {}; }
}
function text(value: unknown, limit = 2000): string { return typeof value === "string" ? value.slice(0, limit) : ""; }

export function readFounder(raw: string): FounderDetails {
  const data = parseRecord(raw);
  return {
    name: text(data.name, 120), tagline: text(data.tagline, 180), audience: text(data.audience, 500),
    problem: text(data.problem, 1000), approach: text(data.approach, 1000), outcome: text(data.outcome, 1000),
    websiteUrl: text(data.websiteUrl, 2048), stage: text(data.stage, 200),
  };
}
export function readKit(raw: string): LaunchKitData {
  const data = parseRecord(raw);
  return { ...EMPTY_KIT, name: text(data.name, 120), tagline: text(data.tagline, 180), description: text(data.description, 4000),
    websiteUrl: text(data.websiteUrl, 2048), audience: text(data.audience, 1000), stage: text(data.stage, 200),
    evidence: text(data.evidence), team: text(data.team),
    assets: Array.isArray(data.assets) ? data.assets.slice(0, 20).map(item => {
      const asset = record(item); return { label: text(asset.label, 120), url: safeLaunchUrl(text(asset.url, 2048)) };
    }).filter(asset => asset.label && asset.url) : [],
  };
}
export function buildPitch(details: FounderDetails) {
  const name = details.name.trim(); const audience = details.audience.trim();
  const problem = details.problem.trim(); const approach = details.approach.trim();
  const outcome = details.outcome.trim();
  if (!name || !audience || !approach || !outcome) return null;
  const oneLine = `${name} helps ${audience} ${outcome.replace(/[.!?]+$/, "")} by ${approach.replace(/[.!?]+$/, "")}.`;
  const introduction = [oneLine, problem ? `The problem we are working on: ${problem}` : "", details.stage.trim() ? `Current stage: ${details.stage.trim()}.` : ""].filter(Boolean).join("\n\n");
  const website = safeLaunchUrl(details.websiteUrl);
  const announcement = [`Meet ${name}.`, introduction, website ? `Explore it: ${website}` : "Get in touch to learn more."].join("\n\n");
  return { oneLine, introduction, announcement };
}

export type MvpFeature = { id: string; name: string; promise: boolean; essential: boolean; manual: boolean };
export type MvpDraft = { features: MvpFeature[]; success: string };
export function readMvp(raw: string): MvpDraft {
  const data = parseRecord(raw); const ids = new Set<string>();
  const features = (Array.isArray(data.features) ? data.features : []).slice(0, 40).flatMap(item => {
    const row = record(item); const id = text(row.id, 100); const name = text(row.name, 160);
    if (!id || !name || ids.has(id)) return []; ids.add(id);
    return [{ id, name, promise: row.promise === true, essential: row.essential === true, manual: row.manual === true }];
  });
  return { features, success: text(data.success) };
}
export function featureBucket(feature: MvpFeature): "Build first" | "Handle manually" | "Save for later" {
  if (!feature.promise && !feature.essential) return "Save for later";
  return feature.manual ? "Handle manually" : "Build first";
}

export const EVIDENCE_SIGNALS = ["No clear signal", "Problem confirmed", "Asked to try", "Committed to a next step"] as const;
export type EvidenceNote = { id: string; participant: string; observation: string; signal: typeof EVIDENCE_SIGNALS[number] };
export type ValidationDraft = { hypothesis: string; recruitment: string; criterion: string; nextStep: string; notes: EvidenceNote[] };
export function readValidation(raw: string): ValidationDraft {
  const data = parseRecord(raw); const ids = new Set<string>();
  return { hypothesis: text(data.hypothesis), recruitment: text(data.recruitment), criterion: text(data.criterion), nextStep: text(data.nextStep),
    notes: (Array.isArray(data.notes) ? data.notes : []).slice(0, 50).flatMap(item => {
      const note = record(item); const id = text(note.id, 100);
      if (!id || ids.has(id)) return []; ids.add(id);
      return [{ id, participant: text(note.participant, 120), observation: text(note.observation),
        signal: EVIDENCE_SIGNALS.includes(note.signal as typeof EVIDENCE_SIGNALS[number]) ? note.signal as typeof EVIDENCE_SIGNALS[number] : EVIDENCE_SIGNALS[0] }];
    }),
  };
}
export function interviewQuestions(details: FounderDetails): string[] {
  return [
    details.problem.trim() ? `You described the problem as “${details.problem.trim()}”. When did you last experience it? Walk me through what happened.` : "Tell me about the last time you experienced this problem. Walk me through what happened.",
    "What did you do to solve it? Walk me through the steps.",
    "Which part took the most time, effort or money?",
    "What alternatives have you tried, and why did you keep or stop using them?",
    "How often does this happen? What happens if you leave it unresolved?",
    "Who chooses a solution, and who pays for it?",
    "What would need to change for you to try a different approach?",
  ];
}

export type RunwayDraft = { cash: string; expenses: string; revenue: string; adjustment: string };
export function readRunway(raw: string): RunwayDraft {
  const data = parseRecord(raw);
  return { cash: text(data.cash, 30), expenses: text(data.expenses, 30), revenue: text(data.revenue, 30), adjustment: text(data.adjustment, 10) || "0" };
}
export function calculateRunway(data: RunwayDraft) {
  const entries = [data.cash, data.expenses, data.revenue];
  if (entries.some(value => !value.trim())) return { error: "Enter cash, monthly expenses and monthly revenue. Use 0 where appropriate." } as const;
  const [cash, expenses, revenue] = entries.map(Number); const adjustment = Number(data.adjustment);
  if ([cash, expenses, revenue].some(value => !Number.isFinite(value) || value < 0 || value > 1e12) ||
    !Number.isFinite(adjustment) || adjustment < -50 || adjustment > 50) {
    return { error: "Use amounts from 0 to 1,000,000,000,000 and an expense change between −50% and +50%." } as const;
  }
  const cashPaise = Math.round(cash * 100); const revenuePaise = Math.round(revenue * 100);
  const expensePaise = Math.round(expenses * (1 + adjustment / 100) * 100);
  const burnPaise = expensePaise - revenuePaise;
  return { cash: cashPaise / 100, expenses: expensePaise / 100, revenue: revenuePaise / 100, burn: burnPaise / 100,
    months: burnPaise > 0 ? cashPaise / burnPaise : null,
    balances: Array.from({ length: 12 }, (_, index) => ({ month: index + 1, balance: Math.max(0, cashPaise - burnPaise * (index + 1)) / 100 })),
  };
}
export function rupees(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export const SUBMISSION_STATUSES = ["Not started", "Preparing", "Submitted", "Accepted", "Declined"] as const;
export type Submission = { id: string; name: string; url: string; status: typeof SUBMISSION_STATUSES[number]; listingUrl: string; followUp: string; notes: string };
export const DEFAULT_SUBMISSIONS: Submission[] = LAUNCH_DIRECTORIES.map((item, index) => ({
  id: `directory-${index}`, name: item.name, url: item.url, status: "Not started", listingUrl: "", followUp: "", notes: "",
}));
export function readSubmissions(raw: string): Submission[] {
  if (!raw) return DEFAULT_SUBMISSIONS;
  const data = parseRecord(raw);
  if (!Array.isArray(data.rows)) return DEFAULT_SUBMISSIONS;
  const ids = new Set<string>();
  return data.rows.slice(0, 50).flatMap(item => {
    const row = record(item); const id = text(row.id, 100); const name = text(row.name, 120);
    if (!id || !name || ids.has(id)) return []; ids.add(id);
    const followUp = text(row.followUp, 10);
    return [{ id, name, url: safeLaunchUrl(text(row.url, 2048)),
      status: SUBMISSION_STATUSES.includes(row.status as typeof SUBMISSION_STATUSES[number]) ? row.status as typeof SUBMISSION_STATUSES[number] : "Not started",
      listingUrl: text(row.listingUrl, 2048), followUp: /^\d{4}-\d{2}-\d{2}$/.test(followUp) ? followUp : "", notes: text(row.notes),
    }];
  });
}
export function submissionsCsv(rows: Submission[]): string {
  function cell(value: string) {
    const safe = /^[\s]*[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
    return `"${safe.replaceAll('"', '""')}"`;
  }
  return "\uFEFF" + [["Directory", "Submission URL", "Status", "Listing URL", "Follow-up date", "Notes"],
    ...rows.map(row => [row.name, safeLaunchUrl(row.url), row.status, safeLaunchUrl(row.listingUrl), row.followUp, row.notes])]
    .map(row => row.map(cell).join(",")).join("\r\n");
}
