import { Skeleton } from "@/components/ui/skeleton";

export function RankingRowsLoading({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading startup rankings" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <span className="sr-only">Loading startup rankings…</span>
      <div aria-hidden="true" className="space-y-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex min-h-28 items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
            <Skeleton className="h-6 w-6 shrink-0" />
            <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3"><Skeleton className="h-5 w-2/5" /><Skeleton className="h-4 w-4/5" /></div>
            <Skeleton className="h-12 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PublicListLoading({ rankings = false }: { rankings?: boolean }) {
  return (
    <div>
      <div aria-hidden="true" className="page-intro-spacing border-b border-gray-100 bg-white px-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
          <Skeleton className="h-12 w-3/5" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-12 w-full max-w-xl" />
        </div>
      </div>
      {rankings ? <RankingRowsLoading count={8} /> : (
        <div role="status" aria-busy="true" aria-label="Loading results" className="mx-auto max-w-7xl px-4 py-12">
          <span className="sr-only">Loading results…</span>
          <div aria-hidden="true" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="min-h-64 space-y-5 rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center gap-4"><Skeleton className="h-12 w-12 shrink-0 rounded-xl" /><Skeleton className="h-6 w-2/3" /></div>
                <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-8 h-10 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
