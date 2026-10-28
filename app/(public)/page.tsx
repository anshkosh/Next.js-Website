import { PILOT_DESCRIPTION, seoMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { RankingRowsLoading } from "@/components/layout/PublicListLoading";

import LandingHero from "@/components/landing/LandingHero";
import FeaturedStartups from "@/components/landing/FeaturedStartups";
import LandingMission from "@/components/landing/LandingMission";
import LandingFounderStory from "@/components/landing/LandingFounderStory";
import TopRankedStartups from "@/components/landing/TopRankedStartups";
import LandingParticipation from "@/components/landing/LandingParticipation";
import LandingFAQTeaser from "@/components/landing/LandingFAQTeaser";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFeaturedOn from "@/components/landing/LandingFeaturedOn";

export const metadata = seoMetadata({
  title: "Anshkosh | Explore Indian Startups and What Founders Are Building",
  description: PILOT_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  return (
    <div className="w-full">
      <LandingHero />
      <FeaturedStartups />
      <LandingFounderStory />
      <Suspense fallback={<RankingRowsLoading />}>
        <TopRankedStartups />
      </Suspense>
      <LandingParticipation />
      <LandingMission />
      <LandingFAQTeaser />
      <LandingCTA />
      <LandingFeaturedOn />
    </div>
  );
}
