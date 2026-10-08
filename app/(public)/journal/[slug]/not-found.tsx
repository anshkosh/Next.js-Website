import Link from "next/link";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";

export default function JournalPostNotFound() {
  return (
    <ErrorState
      status="404 · Story not found"
      title="That story gave us the slip."
      message="We couldn’t find this journal article. There are other stories to explore, or you can suggest the next one."
      foxComment="A disappearing story? Bit much for a plot twist."
    >
      <Link href="/journal" className={recoveryLinkClass}>Back to the Journal</Link>
      <Link href="/contact" className={secondaryRecoveryLinkClass}>Suggest a story</Link>
    </ErrorState>
  );
}
