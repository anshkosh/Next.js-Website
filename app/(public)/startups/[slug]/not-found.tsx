import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6">
        <Search size={40} />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading">Startup Not Found</h1>
      <p className="text-gray-500 text-lg mb-8 max-w-md text-center">
        We couldn't find the startup you're looking for. It may have been removed or is still in draft.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-coral-500 text-white rounded-lg font-medium hover:bg-coral-600 transition-colors shadow-sm"
      >
        Explore other startups
      </Link>
    </div>
  );
}
