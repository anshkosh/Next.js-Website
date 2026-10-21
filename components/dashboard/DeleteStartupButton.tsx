"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStartup } from "@/app/actions/startup.actions";
import { Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// The shared dialog traps focus, closes on Escape and returns focus to this button.
export default function DeleteStartupButton({
  startupId,
  startupName,
}: {
  startupId: string;
  startupName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      const res = await deleteStartup(startupId);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Delete startup error:", err);
      setError("We could not delete this startup. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => { if (!isDeleting) { setOpen(next); setError(""); } }}>
      <DialogTrigger
        aria-label={`Delete ${startupName}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 size={16} aria-hidden="true" /> Delete startup
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-0 p-6 sm:max-w-md">
        <DialogTitle className="font-heading text-xl font-bold text-gray-900">Delete {startupName}?</DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-relaxed text-gray-600">
          This permanently removes the startup profile with its team, votes, updates, discussion and beta tester program. Your journal entries are kept but no longer linked to it. This cannot be undone.
        </DialogDescription>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <div className="mt-6 flex gap-3">
          <DialogClose
            disabled={isDeleting}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Keep startup
          </DialogClose>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
          >
            {isDeleting ? <><Loader2 size={18} aria-hidden="true" className="animate-spin" /> Deleting…</> : "Delete permanently"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
