import LaunchChecklist from "@/components/launch/LaunchChecklist";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Free Startup Launch Checklist", description: "Prepare your evidence, profile, launch materials and directory choices with a free interactive startup launch checklist.", path: "/launch-support/checklist" });

export default function ChecklistPage() {
  return <LaunchToolLayout active="checklist" title="Get ready to share your startup." description="Work through the essentials before publishing. A preparation checklist—not a validation score or launch guarantee."><LaunchChecklist /></LaunchToolLayout>;
}
