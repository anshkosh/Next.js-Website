import ValidationPlanner from "@/components/launch/ValidationPlanner";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Free Customer Validation Planner", description: "Plan customer interviews, record real evidence and decide what to test next. Free worksheets and downloadable notes for startup founders.", path: "/launch-support/validation" });

export default function ValidationPage() {
  return <LaunchToolLayout active="validation" title="Learn before you launch." description="Plan a conversation, listen to what people do today, and keep a record of the evidence behind your next decision."><ValidationPlanner /></LaunchToolLayout>;
}
