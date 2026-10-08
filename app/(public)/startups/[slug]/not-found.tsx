import Link from "next/link";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";

export default function NotFound() {
  return (
    <ErrorState
      status="404 · Startup not found"
      title="A pitch. A trail. A wrong turn."
      message="We couldn’t find a public startup profile at this address. Let’s get you back to the builders."
      foxComment="Stealth mode is getting a little out of hand."
    >
      <Link href="/discover" className={recoveryLinkClass}>Explore startups</Link>
      <Link href="/" className={secondaryRecoveryLinkClass}>Back to homepage</Link>
    </ErrorState>
  );
}
