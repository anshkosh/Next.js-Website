import DirectoryCatalogue from "@/components/launch/DirectoryCatalogue";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Startup Directory Catalogue", description: "Find relevant startup directories with official sources, eligibility notes and cost labels. Free to browse; external directory fees may apply.", path: "/launch-support/directories" });

export default function DirectoryPage() {
  return <LaunchToolLayout active="directories" title="Find the right places to list." description="A small, source-backed starter catalogue. Choose audience fit before backlink counts."><DirectoryCatalogue /></LaunchToolLayout>;
}
