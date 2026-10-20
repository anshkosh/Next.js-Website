import { db } from "@/lib/db";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import UpvoteButton from "@/components/upvote/UpvoteButton";
import Link from "next/link";
import { cookies } from "next/headers";
import FoundersSection from "@/components/startup/FoundersSection";
import MediaGallery from "@/components/startup/MediaGallery";
import KeyFeaturesSection from "@/components/startup/KeyFeaturesSection";
import UpdatesSection from "@/components/startup/UpdatesSection";
import DiscussionSection from "@/components/startup/DiscussionSection";
import StartupTabNav from "@/components/startup/StartupTabNav";
import CorePropositionSection from "@/components/startup/CorePropositionSection";
import { SITE_URL, absoluteUrl, startupOrganizationSchema } from "@/lib/seo";
import { pitchDeckUrlSchema } from "@/lib/validators/pitch-deck.schema";
import { publicPitchDeck } from "@/lib/pitch-deck-access";
import { publicFounderEntries } from "@/lib/founder-journal-queries";
import { journalPage } from "@/lib/founder-journal";
import FounderJournalSection from "@/components/startup/FounderJournalSection";
import BetaTesterSignup from "@/components/startup/BetaTesterSignup";
import { viewerSession } from "@/lib/viewer-session";
import { fetchOwnPendingComments, getCommentAvailability } from "@/app/actions/comment.actions";

// Visitor-specific cookies must be read at request time, including for new slugs.
export const dynamic = "force-dynamic";

type StartupFeature = {
  icon: string;
  title: string;
  description: string;
};

type StartupMetadata = {
  city?: string;
  foundedYear?: string | number;
  twitterUrl?: string;
  linkedinUrl?: string;
  features?: StartupFeature[];
  pitchDeckUrl?: string;
};

function readStartupMetadata(value: unknown): StartupMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const record = value as Record<string, unknown>;
  const features = Array.isArray(record.features)
    ? record.features.filter((feature): feature is StartupFeature => {
        if (!feature || typeof feature !== "object" || Array.isArray(feature)) {
          return false;
        }

        const item = feature as Record<string, unknown>;
        return (
          typeof item.icon === "string" &&
          typeof item.title === "string" &&
          typeof item.description === "string"
        );
      })
    : undefined;

  return {
    city: typeof record.city === "string" ? record.city : undefined,
    foundedYear:
      typeof record.foundedYear === "string" ||
      typeof record.foundedYear === "number"
        ? record.foundedYear
        : undefined,
    twitterUrl:
      typeof record.twitterUrl === "string" ? record.twitterUrl : undefined,
    linkedinUrl:
      typeof record.linkedinUrl === "string"
        ? record.linkedinUrl
        : undefined,
    features,
    pitchDeckUrl: publicPitchDeck(record) && pitchDeckUrlSchema.safeParse(record.pitchDeckUrl).success ? record.pitchDeckUrl as string : undefined,
  };
}

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];

  const startups = await db.startup.findMany({
    where: { status: "LIVE" },
    select: { slug: true },
  });

  return startups.map((startup) => ({
    slug: startup.slug,
  }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  if (!process.env.DATABASE_URL) notFound();

  const startup = await db.startup.findUnique({
    where: { slug: params.slug, status: "LIVE" },
    include: { category: true },
  });

  if (!startup) {
    const redirect = await db.slugRedirect.findUnique({
      where: { oldSlug: params.slug },
      include: { startup: true },
    });
    if (redirect?.startup?.status === "LIVE") {
      permanentRedirect(`/startups/${redirect.startup.slug}`);
    }
    notFound();
  }

  const baseUrl = SITE_URL;
  const url = `${baseUrl}/startups/${startup.slug}`;

  return {
    title: `${startup.name} — ${startup.tagline} | Anshkosh`,
    description: startup.description.slice(0, 160),
    openGraph: {
      title: startup.name,
      description: startup.tagline,
      url,
      images: [
        { url: `${baseUrl}/api/og/${startup.slug}`, width: 1200, height: 630 },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: startup.name,
      description: startup.tagline,
      images: [absoluteUrl(`/api/og/${startup.slug}`)],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function StartupDetailPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ journalPage?: string }>;
}) {
  const params = await props.params;
  if (!process.env.DATABASE_URL) notFound();

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("anshkosh_vid")?.value;

  const startup = await db.startup.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      upvotes: cookieId
        ? {
            where: { cookieId },
          }
        : false,
          downvotes: cookieId
        ? {
            where: { cookieId },
          }
        : false,
      founders: {
        orderBy: { sortOrder: "asc" }
      },
      updates: {
        orderBy: { createdAt: "desc" },
      },
      betaTesterProgram: { select: { id: true, enabled: true, description: true, reward: true } },
    },
  });

  if (!startup) {
    const redirect = await db.slugRedirect.findUnique({
      where: { oldSlug: params.slug },
      include: { startup: true },
    });
    if (redirect?.startup?.status === "LIVE") {
      permanentRedirect(`/startups/${redirect.startup.slug}`);
    }
    notFound();
  }

  if (startup.status !== "LIVE") {
    notFound();
  }

  const publicJournalPage = journalPage((await props.searchParams).journalPage);
  const publicEntries = await publicFounderEntries(startup.id, startup.founderId, publicJournalPage);

  // Fetch initial approved comments for the discussion section (server-side for SEO)
  const [initialComments, totalApprovedCount, session, initialPendingComments, initialAvailability] = await Promise.all([
    db.comment.findMany({
      where: { startupId: startup.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        authorName: true,
        body: true,
        reply: true,
        repliedAt: true,
        repliedBy: true,
        createdAt: true,
      },
    }),
    db.comment.count({
      where: { startupId: startup.id, status: "APPROVED" },
    }),
    viewerSession(),
    fetchOwnPendingComments(startup.id),
    getCommentAvailability(),
  ]);

  // Determine if there is a next cursor for the comments
  const hasMoreComments = totalApprovedCount > 10;
  const initialNextCursor = hasMoreComments
    ? initialComments[initialComments.length - 1]?.id ?? null
    : null;

  const { city, foundedYear, twitterUrl, linkedinUrl, features, pitchDeckUrl } =
    readStartupMetadata(startup.metadata);
  const hasUpvoted = Boolean(startup.upvotes?.length);
  const hasDownvoted = Boolean(startup.downvotes?.length);
  const updates = startup.updates.map((update) => ({
    ...update,
    createdAt: update.createdAt.toISOString(),
  }));


  const tabs = [
    { id: "section-overview", label: "Overview" },
    { id: "section-proposition", label: "Core Proposition" },
    { id: "section-updates", label: "Updates", count: startup.updates.length },
    { id: "section-founder-journal", label: "Founder Journal" },
    ...(startup.betaTesterProgram?.enabled ? [{ id: "section-beta-testers", label: "Beta testers" }] : []),
    { id: "section-questions", label: "Questions", count: totalApprovedCount },
  ];

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Premium Hero Header */}
      <div className="w-full bg-coral-500 text-white pt-16 pb-12">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-center">
          
          {/* Left Side: Logo, Name, Meta */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 relative rounded-2xl overflow-hidden bg-white flex-shrink-0 shadow-lg border border-coral-400/30">
              {startup.logoUrl ? (
                <Image
                  src={startup.logoUrl}
                  alt={startup.name}
                  fill
                  sizes="96px"
                  preload
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400 font-bold">
                  {startup.name.charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-extrabold font-heading">
                {startup.name}
              </h1>
              <p className="text-coral-50 text-lg max-w-2xl">
                {startup.tagline}
              </p>
              
              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Link href={`/category/${startup.category.slug}`} className="inline-flex items-center px-3 py-1 bg-coral-600/50 hover:bg-coral-600 rounded-full text-sm font-medium transition-colors border border-coral-400/50">
                  {startup.category.name}
                </Link>
                {city && (
                  <span className="inline-flex items-center px-3 py-1 bg-coral-600/50 rounded-full text-sm font-medium border border-coral-400/50">
                    📍 {city}
                  </span>
                )}
                {foundedYear && (
                  <span className="inline-flex items-center px-3 py-1 bg-coral-600/50 rounded-full text-sm font-medium border border-coral-400/50">
                    📅 {foundedYear}
                  </span>
                )}
                {/* Socials */}
                <div className="flex items-center gap-2 ml-2">
                  {twitterUrl && (
                    <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-coral-600/50 hover:bg-coral-600 rounded-full transition-colors border border-coral-400/50">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                    </a>
                  )}
                  {linkedinUrl && (
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-coral-600/50 hover:bg-coral-600 rounded-full transition-colors border border-coral-400/50">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side: Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0">
            <a
              href={startup.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-white text-coral-600 rounded-xl font-bold text-center hover:bg-gray-50 transition-colors shadow-sm"
            >
              Visit Website
            </a>
            <div className="w-full sm:w-auto bg-white rounded-xl shadow-sm overflow-hidden flex items-center justify-center p-0.5">
              <UpvoteButton
                startupId={startup.id}
                initialCount={startup.upvoteCount}
                initialUpvoted={hasUpvoted}
                initialDownvoted={hasDownvoted}
                initialDownvotes={startup.downvoteCount}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation */}
      <StartupTabNav tabs={tabs} />

      {/* Main Content Area (Full Width) */}
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-12">

        {/* ── Overview Section ── */}
        <div id="section-overview" className="space-y-12 scroll-mt-32">
          <MediaGallery videoUrl={startup.videoUrl} images={startup.galleryImages} />
          {pitchDeckUrl && <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold">Pitch deck</h2>
            <a href={pitchDeckUrl} className="font-medium text-coral-600 underline">Download {startup.name}’s pitch deck (PDF)</a>
          </section>}

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 font-heading">
              What is {startup.name}?
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
              {startup.description}
            </div>
          </div>

          <KeyFeaturesSection features={features} />

          <FoundersSection founders={startup.founders} />
        </div>

        {/* ── Core Proposition Section ── */}
        <div id="section-proposition" className="scroll-mt-32">
          <CorePropositionSection
            problemStatement={startup.problemStatement}
            solutionStatement={startup.solutionStatement}
            targetAudience={startup.targetAudience}
            prototypeStatus={startup.prototypeStatus}
            tractionEvidence={startup.tractionEvidence}
          />
        </div>

        {/* ── Updates Section ── */}
        <div id="section-updates" className="scroll-mt-32">
          <UpdatesSection updates={updates} />
        </div>

        <div id="section-founder-journal" className="scroll-mt-32">
          <FounderJournalSection entries={publicEntries} slug={startup.slug} page={publicJournalPage} />
        </div>

        {startup.betaTesterProgram?.enabled && (
          <div id="section-beta-testers" className="scroll-mt-32">
            <BetaTesterSignup
              startupId={startup.id}
              startupName={startup.name}
              description={startup.betaTesterProgram.description}
              reward={startup.betaTesterProgram.reward}
            />
          </div>
        )}

        {/* ── Questions / Discussion Section ── */}
        <div id="section-questions" className="scroll-mt-32">
          <DiscussionSection
            startupId={startup.id}
            startupSlug={startup.slug}
            initialComments={initialComments.map((c) => ({
              ...c,
              repliedAt: c.repliedAt?.toISOString() ?? null,
              createdAt: c.createdAt.toISOString(),
            }))}
            initialNextCursor={initialNextCursor}
            totalApprovedCount={totalApprovedCount}
            viewer={session ? { name: session.user.name, email: session.user.email } : undefined}
            initialAvailability={initialAvailability}
            initialPendingComments={initialPendingComments}
          />
        </div>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(startupOrganizationSchema(startup)).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
