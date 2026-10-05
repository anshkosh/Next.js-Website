import PitchBuilder from "@/components/launch/PitchBuilder";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Free Startup Pitch Builder", description: "Build a one-line startup pitch, short introduction and launch announcement from your own words. Free to copy and download.", path: "/launch-support/pitch" });

export default function PitchPage() {
  return <LaunchToolLayout active="pitch" title="Explain it clearly." description="A few useful prompts. Three pieces of launch copy. Start with the people you help and what they can achieve."><PitchBuilder /></LaunchToolLayout>;
}
