import LaunchKit from "@/components/launch/LaunchKit";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Free Startup Launch Kit", description: "Prepare and copy your startup pitch, description and team introduction. Download a reusable text kit, free and without automatic submissions.", path: "/launch-support/kit" });

export default function KitPage() {
  return <LaunchToolLayout active="kit" title="Your story. Ready to reuse." description="Keep your launch copy together, then adapt it to each directory. Review every claim before sharing."><LaunchKit /></LaunchToolLayout>;
}
