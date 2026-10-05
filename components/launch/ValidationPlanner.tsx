"use client";

import { useState } from "react";
import { EVIDENCE_SIGNALS, FOUNDER_KEY, interviewQuestions, readFounder, readValidation } from "@/lib/founder-toolkit";
import { useBrowserDraft } from "./useBrowserDraft";
import { ClearDraft, DraftNotice, Field, FounderFields, inputStyle, primaryButton } from "./ToolFields";
import ToolExport, { exportFilename } from "./ToolExport";

export default function ValidationPlanner() {
  const { data, update, clear, storageError } = useBrowserDraft("anshkosh-validation-v1", readValidation);
  const { data: founder } = useBrowserDraft(FOUNDER_KEY, readFounder);
  const [participant, setParticipant] = useState(""); const [observation, setObservation] = useState("");
  const [signal, setSignal] = useState<typeof EVIDENCE_SIGNALS[number]>(EVIDENCE_SIGNALS[0]);
  const questions = interviewQuestions(founder);
  const exportText = `${founder.name || "Startup"} — customer validation plan\nAudience: ${founder.audience || "Not recorded"}\nProblem: ${founder.problem || "Not recorded"}\n\n` +
    `Assumption: ${data.hypothesis || "Not recorded"}\nRecruitment: ${data.recruitment || "Not recorded"}\nSuccess criterion: ${data.criterion || "Not recorded"}\n\nINTERVIEW QUESTIONS\n${questions.map((question, i) => `${i + 1}. ${question}`).join("\n")}\n\nEVIDENCE NOTES\n` +
    (data.notes.map(note => `${note.participant || "Unnamed conversation"}\n${note.observation}\nRecorded signal: ${note.signal}`).join("\n\n") || "No conversations recorded.") + `\n\nNEXT EXPERIMENT\n${data.nextStep || "Not recorded"}`;
  return <>
    <DraftNotice error={storageError} />
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <section aria-labelledby="validation-plan" className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"><h2 id="validation-plan" className="font-heading text-2xl font-bold">Make an assumption testable</h2>
        <FounderFields include={["name", "audience", "problem"]} />
        {[["hypothesis", "What do you need to learn?", "e.g. Office managers lose an hour a day coordinating lunch orders"], ["recruitment", "Where will you find relevant people?", "e.g. Five office managers in local coworking spaces"], ["criterion", "What evidence would change your next decision?", "e.g. Three managers describe a recent problem and agree to test a prototype"], ["nextStep", "What will you test or change next?", "Update this after your conversations"]].map(([id, label, placeholder]) => <Field key={id} label={label}><textarea rows={3} className={inputStyle} maxLength={2000} value={data[id as "hypothesis" | "recruitment" | "criterion" | "nextStep"]} onChange={event => update({ [id]: event.target.value })} placeholder={placeholder} /></Field>)}
        <ClearDraft onClear={clear} />
      </section>
      <section aria-labelledby="interview-guide" className="rounded-2xl border border-coral-200 bg-coral-50 p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-wider text-coral-700">Listen before you pitch</p><h2 id="interview-guide" className="mt-2 font-heading text-3xl font-bold">Ask about what happened.</h2><p className="mt-3 text-sm leading-relaxed text-gray-600">Start with real experiences and existing workarounds. A compliment or a “yes, I would use it” is weaker evidence than a concrete next step.</p><ol className="mt-6 list-decimal space-y-4 pl-5 text-sm leading-relaxed">{questions.map(question => <li key={question} className="break-words pl-1">{question}</li>)}</ol></section>
    </div>
    <section aria-labelledby="evidence-notes" className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="evidence-notes" className="font-heading text-2xl font-bold">Record the evidence</h2><span className="text-sm text-gray-600">{data.notes.length} conversation{data.notes.length === 1 ? "" : "s"} recorded</span></div><p className="mt-2 text-sm text-gray-600">Use participant labels such as “Office manager 1”. Record observations separately from your interpretation.</p>
      <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); if (!observation.trim() || data.notes.length >= 50) return; update(previous => ({ ...previous, notes: [...previous.notes, { id: crypto.randomUUID(), participant: participant.trim(), observation: observation.trim(), signal }] })); setParticipant(""); setObservation(""); setSignal(EVIDENCE_SIGNALS[0]); }}>
        <Field label="Participant label"><input value={participant} maxLength={120} onChange={event => setParticipant(event.target.value)} className={inputStyle} placeholder="Office manager 1" /></Field>
        <Field label="Signal you observed"><select value={signal} onChange={event => setSignal(event.target.value as typeof signal)} className={inputStyle}>{EVIDENCE_SIGNALS.map(value => <option key={value}>{value}</option>)}</select></Field>
        <div className="sm:col-span-2"><Field label="What did they say or do?"><textarea rows={3} value={observation} maxLength={2000} onChange={event => setObservation(event.target.value)} className={inputStyle} placeholder="Record a quote, a recent example, or an action they actually took" /></Field></div>
        <div className="sm:col-span-2"><button disabled={!observation.trim() || data.notes.length >= 50} className={primaryButton}>Add evidence note</button><p className="mt-2 text-xs text-gray-600">Up to 50 notes in this draft.</p></div>
      </form>
      <div className="mt-6 space-y-4">{data.notes.map(note => <article key={note.id} className="rounded-xl bg-gray-50 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="break-words font-semibold">{note.participant || "Unnamed conversation"}</h3><button type="button" aria-label={`Remove note for ${note.participant || "unnamed conversation"}`} onClick={() => update(previous => ({ ...previous, notes: previous.notes.filter(row => row.id !== note.id) }))} className="text-xs text-gray-600 underline underline-offset-4">Remove note</button></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{note.observation}</p><p className="mt-3 text-xs font-semibold text-coral-700">Recorded signal: {note.signal}</p></article>)}</div>
      <ToolExport text={exportText} filename={exportFilename(founder.name, "validation-plan.txt")} />
    </section>
  </>;
}
