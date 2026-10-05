import LaunchCardMaker from "@/components/launch/LaunchCardMaker";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Free Launch Card Maker", description: "Make and download a startup launch graphic with your own logo, tagline and link. Free landscape and square PNG exports.", path: "/launch-support/launch-card" });

export default function LaunchCardPage() {
  return <LaunchToolLayout active="launch-card" title="Give your launch a face." description="Use your startup details, choose a style and download a full-size graphic. No watermark or account required."><LaunchCardMaker /></LaunchToolLayout>;
}
