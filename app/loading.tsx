export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-1/3 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>
  );
}
