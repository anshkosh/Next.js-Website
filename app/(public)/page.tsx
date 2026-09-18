import { Metadata } from "next";

import LandingHero from "@/components/landing/LandingHero";
import LandingMission from "@/components/landing/LandingMission";
import LandingValueProps from "@/components/landing/LandingValueProps";
import LandingFounders from "@/components/landing/LandingFounders";
import LandingProgress from "@/components/landing/LandingProgress";
import LandingSignal from "@/components/landing/LandingSignal";
import LandingWorkflow from "@/components/landing/LandingWorkflow";
import FeaturedStartups from "@/components/landing/FeaturedStartups";
import LandingParticipation from "@/components/landing/LandingParticipation";
import LandingFAQTeaser from "@/components/landing/LandingFAQTeaser";
import LandingCTA from "@/components/landing/LandingCTA";

export const metadata: Metadata = {
  title: "Anshkosh | Discover Indian Startups Before Launch",
  description:
    "Discover Indian startups before launch, examine what they can prove, and follow the teams turning early demand into measurable traction.",
};

export default async function HomePage() {
  return (
    <div className="w-full">
      <LandingHero />
      <FeaturedStartups />
      <LandingMission />
      <LandingValueProps />
      <LandingFounders />
      <LandingProgress />
      <LandingSignal />
      <LandingWorkflow />
      <LandingParticipation />
      <LandingFAQTeaser />
      <LandingCTA />
    </div>
  );
}
