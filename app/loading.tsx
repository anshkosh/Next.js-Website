export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-gray-50/50" role="status" aria-label="Loading">
      <div className="flex items-center gap-3 text-sm font-medium text-gray-500"><span className="h-3 w-3 animate-pulse rounded-full bg-coral-500" /><span>Loading Anshkosh…</span></div>
    </div>
  );
}
