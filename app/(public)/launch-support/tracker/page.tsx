import SubmissionTracker from "@/components/launch/SubmissionTracker";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Free Directory Submission Tracker", description: "Track startup directory submissions, accepted listing links and follow-up dates. Save in your browser and download a CSV log for free.", path: "/launch-support/tracker" });

export default function TrackerPage() {
  return <LaunchToolLayout active="tracker" title="Keep your launch channels in order." description="A simple submission log, from your first draft to an accepted listing. Add your own directories and keep a copy of the record."><SubmissionTracker /></LaunchToolLayout>;
}
