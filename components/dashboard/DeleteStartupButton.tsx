"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStartup } from "@/app/actions/startup.actions";
import { Trash2, AlertCircle, Loader2 } from "lucide-react";

export default function DeleteStartupButton({
  startupId,
  startupName,
}: {
  startupId: string;
  startupName: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteStartup(startupId);
      if (res.error) {
        alert(res.error);
      } else {
        setShowConfirm(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Delete startup error:", err);
      alert("Failed to delete startup. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors z-10"
        title="Delete startup"
      >
        <Trash2 size={18} />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] overflow-y-auto" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDeleting) setShowConfirm(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-startup-title" className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 relative">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 mx-auto">
                <AlertCircle size={24} />
              </div>
              
              <h3 id="delete-startup-title" className="text-xl font-bold text-center text-gray-900 mb-2">
                Delete Startup
              </h3>
              
              <p className="text-center text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{startupName}</span>? This action is permanent and cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
