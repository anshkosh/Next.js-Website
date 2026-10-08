import { seoMetadata } from "@/lib/seo";

import LandingHero from "@/components/landing/LandingHero";
import LandingMission from "@/components/landing/LandingMission";
import LandingFounderStory from "@/components/landing/LandingFounderStory";
import FeaturedStartups from "@/components/landing/FeaturedStartups";
import LandingParticipation from "@/components/landing/LandingParticipation";
import LandingFAQTeaser from "@/components/landing/LandingFAQTeaser";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFeaturedOn from "@/components/landing/LandingFeaturedOn";

export const metadata = seoMetadata({
  title: "Anshkosh | Discover Indian Startups Before Launch",
  description: "Discover what Indian founders are building, explore their startup stories and progress, and take your next step with nine free founder tools.",
  path: "/",
});

export default async function HomePage() {
  return (
    <div className="w-full">
      <LandingHero />
      <FeaturedStartups />
      <LandingFounderStory />
      <LandingParticipation />
      <LandingMission />
      <LandingFAQTeaser />
      <LandingCTA />
      <LandingFeaturedOn />
    </div>
  );
}
