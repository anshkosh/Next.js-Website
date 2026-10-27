import { seoMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { RankingRowsLoading } from "@/components/layout/PublicListLoading";

import LandingHero from "@/components/landing/LandingHero";
import LandingMission from "@/components/landing/LandingMission";
import LandingFounderStory from "@/components/landing/LandingFounderStory";
import TopRankedStartups from "@/components/landing/TopRankedStartups";
import LandingParticipation from "@/components/landing/LandingParticipation";
import LandingFAQTeaser from "@/components/landing/LandingFAQTeaser";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFeaturedOn from "@/components/landing/LandingFeaturedOn";

export const metadata = seoMetadata({
  title: "Anshkosh | Discover Indian Startups and Follow Founder Progress",
  description: "Discover what Indian founders are building, explore their startup stories and progress, and take your next step with nine free founder tools.",
  path: "/",
});

export default async function HomePage() {
  return (
    <div className="w-full">
      <LandingHero />
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
