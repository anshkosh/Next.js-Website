"use client";

import { calculateRunway, readRunway, rupees, FOUNDER_KEY, readFounder } from "@/lib/founder-toolkit";
import { useBrowserDraft } from "./useBrowserDraft";
import { ClearDraft, DraftNotice, Field, inputStyle } from "./ToolFields";
import ToolExport, { exportFilename } from "./ToolExport";

export default function RunwayCalculator() {
  const { data, update, clear, storageError } = useBrowserDraft("anshkosh-runway-v1", readRunway);
  const { data: founder } = useBrowserDraft(FOUNDER_KEY, readFounder);
  const result = calculateRunway(data);
  const valid = !('error' in result);
  const runway = valid ? (result.months === null ? "Cash is not shrinking" : `${result.months.toFixed(1)} months`) : "—";
  const exportText = valid ? `RUNWAY SCENARIO\nCash available: ${rupees(result.cash)}\nMonthly expenses: ${rupees(result.expenses)}\nMonthly revenue: ${rupees(result.revenue)}\nExpense adjustment: ${data.adjustment}%\nMonthly net cash outflow: ${rupees(result.burn)}\nRunway: ${runway}\n\nAssumes constant monthly cash costs and revenue collected, with no new funding or one-off costs.\n\n${result.balances.map(row => `Month ${row.month}: ${rupees(row.balance)}`).join("\n")}` : "";
  return <>
    <DraftNotice error={storageError} />
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section aria-labelledby="runway-inputs" className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"><h2 id="runway-inputs" className="font-heading text-2xl font-bold">Work with your cash figures</h2>
        {[["cash", "Cash available today (₹)", "Money available to spend, rather than funding you hope to raise"], ["expenses", "Monthly cash expenses (₹)", "Include recurring payroll, rent, tools and other cash costs"], ["revenue", "Monthly revenue collected (₹)", "Use cash received, rather than unpaid invoices"]].map(([id, label, hint]) => <Field key={id} label={label} hint={hint}><input type="number" min="0" max="1000000000000" step="any" inputMode="decimal" placeholder="0" value={data[id as "cash" | "expenses" | "revenue"]} onChange={event => update({ [id]: event.target.value })} className={inputStyle} /></Field>)}
        <Field label={`Try an expense change: ${Number(data.adjustment) > 0 ? "+" : ""}${data.adjustment}%`} hint="Revenue stays the same in this scenario."><input type="range" min="-50" max="50" step="5" value={data.adjustment} onChange={event => update({ adjustment: event.target.value })} className="mt-4 w-full accent-coral-600" /></Field>
        <ClearDraft onClear={clear} />
      </section>
      <section aria-labelledby="runway-results" className="min-w-0 rounded-2xl border border-coral-200 bg-coral-50 p-5 sm:p-7"><h2 id="runway-results" className="font-heading text-3xl font-bold">See what changes.</h2>
        {valid ? <>
          <div className="mt-6 rounded-xl bg-white p-5"><p className="text-sm text-gray-600">Estimated runway</p><p className="mt-2 break-words font-heading text-4xl font-bold text-coral-800">{runway}</p>{result.months === null && <p className="mt-2 text-sm text-gray-600">Monthly revenue covers these expenses under your assumptions.</p>}</div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-medium text-gray-600">{result.burn >= 0 ? "Monthly net cash outflow" : "Monthly cash surplus"}</dt><dd className="mt-1 break-words text-xl font-semibold">{rupees(Math.abs(result.burn))}</dd></div><div><dt className="text-xs font-medium text-gray-600">Monthly revenue needed to cover costs</dt><dd className="mt-1 break-words text-xl font-semibold">{rupees(result.expenses)}</dd></div></dl>
          <h3 className="mb-3 mt-7 text-sm font-semibold">Cash over the next 12 months</h3>
          <table className="w-full text-left text-sm"><caption className="sr-only">Projected cash remaining with constant monthly costs and revenue</caption><thead><tr className="border-b border-coral-200"><th scope="col" className="pb-2">Month</th><th scope="col" className="pb-2 text-right">Cash remaining</th></tr></thead><tbody>{result.balances.map(row => <tr key={row.month} className="border-b border-coral-100"><th scope="row" className="py-2 font-normal">{row.month}</th><td className="py-2 text-right tabular-nums">{rupees(row.balance)}</td></tr>)}</tbody></table>
        </> : <p role="status" className="mt-6 text-sm leading-relaxed text-gray-600">{result.error}</p>}
        <p className="mt-5 text-xs leading-relaxed text-gray-600">Assumes constant monthly cash costs and revenue collected, with no new funding or one-off costs. Calculations round to the nearest paise; displayed amounts round to rupees. Cash is shown as zero once exhausted. This is a planning estimate.</p>
        <ToolExport text={exportText} disabled={!valid} filename={exportFilename(founder.name, "runway.txt")} />
      </section>
    </div>
  </>;
}
