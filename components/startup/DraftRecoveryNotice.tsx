"use client";
export default function DraftRecoveryNotice({ draft }: { draft: {
  recovery: object | null; savedAt: number | null; storageError: boolean;
  restoreDraft: () => void; discardDraft: () => void;
} }) {
  if (draft.recovery) return <aside className="rounded-xl border border-coral-200 bg-coral-50 p-4 text-sm space-y-3">
    <p className="font-medium">You have unfinished changes saved on this device.</p>
    <p>Restore them to continue, or discard the recovery copy and use the current profile.</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={draft.restoreDraft} className="rounded-lg bg-coral-600 px-3 py-2 text-white">Restore unfinished changes</button>
      <button type="button" onClick={draft.discardDraft} className="rounded-lg border bg-white px-3 py-2">Discard recovery copy</button>
    </div>
  </aside>;
  if (draft.storageError) return <p role="status" className="text-sm text-amber-800">Device recovery is unavailable. Save your draft before leaving this page.</p>;
  return <p role="status" className="text-xs text-gray-500">{draft.savedAt ? "Recovery copy saved on this device. Changes are not submitted until you save." : "Unfinished changes are saved on this device for 7 days. Avoid using a shared computer."}</p>;
}
