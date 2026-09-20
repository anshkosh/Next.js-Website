import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-24 text-center">
        <div className="max-w-xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-coral-500">404</p>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 font-heading">That page has moved on.</h1>
          <p className="mb-8 text-lg text-gray-600">The page you requested could not be found. Head back to Anshkosh and keep exploring.</p>
          <Link href="/" className="inline-flex rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800">Go to homepage</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
