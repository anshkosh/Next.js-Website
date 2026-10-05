import RunwayCalculator from "@/components/launch/RunwayCalculator";
import LaunchToolLayout from "@/components/launch/LaunchToolLayout";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({ title: "Anshkosh — Free Startup Runway Calculator", description: "Estimate startup cash runway in rupees, explore expense changes and download a 12-month cash scenario. Free, with no account required.", path: "/launch-support/runway" });

export default function RunwayPage() {
  return <LaunchToolLayout active="runway" title="Know how far your cash goes." description="Use your current cash, recurring expenses and monthly revenue to explore a simple runway scenario."><RunwayCalculator /></LaunchToolLayout>;
}
