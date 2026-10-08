import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E7]">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center">
        <ErrorState
          status="404 · A little detour"
          title="We couldn’t find that page."
          message="This trail has gone cold. Check the address, try a search, or head home for a fresh start."
          foxComment="I followed the link. It did not follow through."
        >
          <Link href="/" className={recoveryLinkClass}>Back to homepage</Link>
          <Link href="/search" className={secondaryRecoveryLinkClass}>Search Anshkosh</Link>
        </ErrorState>
      </main>
      <Footer />
    </div>
  );
}
