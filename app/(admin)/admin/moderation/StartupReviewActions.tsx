"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { approveStartup, rejectStartup } from "@/app/actions/admin.actions";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function StartupReviewActions({ id, name, returnToQueue = false }: {
  id: string;
  name: string;
  returnToQueue?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState("");

  async function decide(formData?: FormData) {
    setBusy(formData ? "reject" : "approve");
    setError("");
    try {
      if (formData) formData.set("id", id);
      const result = formData ? await rejectStartup(formData) : await approveStartup(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if ("notificationPending" in result && result.notificationPending) {
        alert("Review saved. The founder’s notification is delayed and will be retried automatically.");
      }
      setRejecting(false);
      if (returnToQueue) router.replace("/admin/moderation");
    } catch {
      setError("Unable to confirm the result. Refresh before trying again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <Dialog open={rejecting} onOpenChange={open => { if (!busy) { setRejecting(open); setError(""); } }}>
          <DialogTrigger type="button" disabled={Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-red-200 bg-white px-4 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
            <X size={18} aria-hidden="true" /> Reject
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" showCloseButton={false}>
            <DialogTitle>Reject {name}</DialogTitle>
            <DialogDescription>The founder will receive your reason by email.</DialogDescription>
            <form onSubmit={event => { event.preventDefault(); void decide(new FormData(event.currentTarget)); }}>
              <label className="block font-medium">
                Reason for rejection
                <textarea name="adminNotes" required rows={4} className="mt-2 block w-full rounded-md border border-gray-300 p-3" />
              </label>
              {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
              <DialogFooter className="mt-4">
                <DialogClose type="button" disabled={Boolean(busy)} className="min-h-11 rounded-md px-4 hover:bg-gray-100">Cancel</DialogClose>
                <button type="submit" disabled={Boolean(busy)} className="min-h-11 rounded-md bg-red-700 px-4 font-medium text-white hover:bg-red-800 disabled:opacity-50">
                  {busy === "reject" ? "Rejecting…" : "Confirm Rejection"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <button type="button" onClick={() => void decide()} disabled={Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-green-700 px-4 font-medium text-white hover:bg-green-800 disabled:opacity-50">
          <Check size={18} aria-hidden="true" /> {busy === "approve" ? "Approving…" : "Approve"}
        </button>
      </div>
      {!rejecting && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
