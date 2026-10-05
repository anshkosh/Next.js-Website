"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { LAUNCH_DIRECTORIES } from "@/lib/launch-resources";
import { launchLinkStyle } from "./LaunchToolLayout";

export default function DirectoryCatalogue() {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("All audiences");
  const [cost, setCost] = useState("All costs");
  const results = LAUNCH_DIRECTORIES.filter(item =>
    `${item.name} ${item.audience} ${item.requirements} ${item.stage}`.toLowerCase().includes(query.trim().toLowerCase()) &&
    (audience === "All audiences" || item.audience === audience) &&
    (cost === "All costs" || (cost === "Has a free option" ? item.cost.includes("free") : item.cost === "Paid")));
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-600">Keep track of where you have applied and when to follow up.</p><Link href="/launch-support/tracker" className={launchLinkStyle}>Open submission tracker →</Link></div>
      <aside className="mb-8 rounded-xl border border-coral-200 bg-coral-50 p-5 text-sm leading-relaxed text-gray-700">
        Anshkosh does not submit for you or charge for this catalogue. External directories set their own fees, eligibility and review rules. These are tech-focused channels—not a fit for every startup, including many offline businesses. No acceptance, backlink or search-ranking guarantee.
        <p className="mt-2 font-medium">Official pages checked 2 October 2026. Recheck the source before submitting.</p>
      </aside>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold">Search directories<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, audience or requirement" className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal" /></label>
        <label className="text-sm font-semibold">Audience<select value={audience} onChange={event => setAudience(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal">
          {["All audiences", ...new Set(LAUNCH_DIRECTORIES.map(item => item.audience))].map(value => <option key={value}>{value}</option>)}
        </select></label>
        <label className="text-sm font-semibold">Cost<select value={cost} onChange={event => setCost(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal">
          {["All costs", "Has a free option", "Paid"].map(value => <option key={value}>{value}</option>)}
        </select></label>
      </div>
      <p role="status" className="mb-5 text-sm text-gray-600">{results.length} director{results.length === 1 ? "y matches" : "ies match"} your filters.</p>
      <div className="grid gap-5 lg:grid-cols-2">
        {results.map(item => (
          <article key={item.name} className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading text-2xl font-bold">{item.name}</h2><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{item.cost}</span></div>
            <p className="mt-2 text-sm text-coral-700">{item.audience} · {item.stage}</p>
            <h3 className="mt-5 text-sm font-semibold">Check eligibility</h3><p className="mt-1 text-sm leading-relaxed text-gray-600">{item.requirements}</p>
            <h3 className="mt-4 text-sm font-semibold">Have ready</h3><p className="mt-1 text-sm leading-relaxed text-gray-600">{item.prepare}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className={`${launchLinkStyle} inline-flex items-center gap-2`}>Visit {item.name}<ExternalLink aria-hidden="true" size={14} /></a>
              <a href={item.source} target="_blank" rel="noopener noreferrer" className={launchLinkStyle}>Official source</a>
            </div>
          </article>
        ))}
      </div>
      {results.length === 0 && <div className="rounded-xl border border-gray-200 bg-white p-8"><h2 className="font-heading text-xl font-bold">No matching directories yet</h2><p className="my-3 text-sm text-gray-600">This is a small starter catalogue. Try broader filters; do not submit to an unsuitable directory just to get a link.</p><button type="button" onClick={() => { setQuery(""); setAudience("All audiences"); setCost("All costs"); }} className={launchLinkStyle}>Clear filters</button></div>}
    </>
  );
}
