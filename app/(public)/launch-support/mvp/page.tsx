import MvpScopeCutter from "@/components/launch/MvpScopeCutter";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Free MVP Scope Cutter", description: "Choose which startup features to build first, handle manually or save for later. Create and download a focused MVP plan.", path: "/launch-support/mvp" });

export default function MvpPage() {
  return <LaunchToolLayout active="mvp" title="Build the smallest useful test." description="Turn a feature wish list into a first version that can teach you something. Your answers set the priorities."><MvpScopeCutter /></LaunchToolLayout>;
}
