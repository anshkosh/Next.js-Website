import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { safeLaunchUrl } from "@/lib/launch-resources";
import { publicPitchDeck } from "@/lib/pitch-deck-access";
import { startupMetadataFields } from "@/lib/startup-metadata";
import { startupIdSchema } from "@/lib/validators/id.schema";
import { ownsPitchDeck } from "@/lib/validators/pitch-deck.schema";
import MediaGallery from "@/components/startup/MediaGallery";
import StartupReviewActions from "../StartupReviewActions";
import { requireStaffPage } from "@/lib/staff-session";

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 className="font-heading text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function ReviewField({ label, value, fullWidth = false }: { label: string; value: ReactNode; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "min-w-0 sm:col-span-2" : "min-w-0"}>
      <dt className="text-sm font-semibold text-gray-900">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">{value || "Not provided"}</dd>
    </div>
  );
}

function ReviewLink({ url, children }: { url: string; children: ReactNode }) {
  const href = safeLaunchUrl(url);
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all font-medium text-coral-700 underline underline-offset-4">
      <span>{children}</span><ExternalLink size={14} className="shrink-0" aria-hidden="true" />
    </a>
  ) : <span>Link unavailable</span>;
}

function ReviewImage({ url, label }: { url: string; label: string }) {
  const src = safeLaunchUrl(url);
  return src ? (
    <figure className="min-w-0 space-y-2">
      <figcaption className="text-sm font-medium text-gray-700">{label}</figcaption>
      <a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${label.toLowerCase()} at full size`} className="block rounded-lg border border-gray-200 bg-gray-50 p-2 hover:border-coral-500">
        <Image src={src} alt={label} width={720} height={480} unoptimized referrerPolicy="no-referrer" className="h-52 w-full object-contain" />
      </a>
    </figure>
  ) : (
    <p className="text-sm text-gray-600">{label} unavailable.</p>
  );
}

export default async function StartupSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaffPage();

  const { id } = await params;
  if (!startupIdSchema.safeParse(id).success) notFound();
  const startup = await db.startup.findUnique({
    where: { id, status: "PENDING_REVIEW" },
    select: {
      id: true, name: true, tagline: true, description: true, websiteUrl: true, createdAt: true,
      logoUrl: true, videoUrl: true, galleryImages: true, wallOptIn: true, wallImageUrl: true,
      metadata: true, problemStatement: true, solutionStatement: true, targetAudience: true,
      prototypeStatus: true, tractionEvidence: true, founderName: true, founderId: true,
      category: { select: { name: true } },
      founder: { select: { name: true, email: true } },
      founders: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, name: true, role: true, photoUrl: true, linkedinUrl: true, twitterUrl: true },
      },
    },
  });
  if (!startup) notFound();

  const metadata = startupMetadataFields(startup.metadata);
  const videoUrl = safeLaunchUrl(startup.videoUrl);
  const pitchDeck = ownsPitchDeck(metadata.pitchDeckUrl, startup.founderId) ? metadata.pitchDeckUrl : "";
  const deckVisibility = publicPitchDeck(startup.metadata) ? "Public on profile" : "Private";
  const wallImage = safeLaunchUrl(startup.wallImageUrl) || safeLaunchUrl(startup.logoUrl);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/admin/moderation" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-coral-700 hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Moderation Queue
      </Link>
      <header className="space-y-2">
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">Pending review</span>
        <h1 className="break-words font-heading text-3xl font-bold text-gray-900">{startup.name}</h1>
        <p className="break-words text-gray-700">{startup.tagline}</p>
      </header>

      <ReviewSection title="Startup details">
        <dl className="grid gap-4 sm:grid-cols-2">
          <ReviewField label="Category" value={startup.category.name} />
          <ReviewField label="Website" value={startup.websiteUrl ? <ReviewLink url={startup.websiteUrl}>{startup.websiteUrl}</ReviewLink> : null} />
          <ReviewField label="City" value={metadata.city} />
          <ReviewField label="Founded year" value={metadata.foundedYear} />
          <ReviewField label="Submitted" value={startup.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} />
          <ReviewField label="LinkedIn" value={metadata.linkedinUrl ? <ReviewLink url={metadata.linkedinUrl}>Startup LinkedIn</ReviewLink> : null} />
          <ReviewField label="X / Twitter" value={metadata.twitterUrl ? <ReviewLink url={metadata.twitterUrl}>Startup X profile</ReviewLink> : null} />
          <ReviewField label="Full description" value={startup.description} fullWidth />
        </dl>
      </ReviewSection>

      <ReviewSection title="Submitted media">
        <div className="grid gap-4 sm:grid-cols-2">
          {startup.logoUrl ? <ReviewImage url={startup.logoUrl} label="Startup logo" /> : <p className="text-sm text-gray-600">No logo submitted.</p>}
          {startup.galleryImages.map((url, index) => <ReviewImage key={index} url={url} label={`Gallery image ${index + 1}`} />)}
        </div>
        {!startup.galleryImages.length && <p className="text-sm text-gray-600">No gallery images submitted.</p>}
        {videoUrl ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Demo video</p>
            <ReviewLink url={videoUrl}>Open demo video</ReviewLink>
            <MediaGallery videoUrl={videoUrl} />
          </div>
        ) : <p className="text-sm text-gray-600">No playable demo link submitted.</p>}
        <dl>
          <ReviewField label="Pitch deck" value={pitchDeck ? <ReviewLink url={pitchDeck}>Download pitch deck (PDF) · {deckVisibility}</ReviewLink> : null} />
        </dl>
      </ReviewSection>

      <ReviewSection title="Core proposition">
        <dl className="grid gap-4 sm:grid-cols-2">
          <ReviewField label="Problem" value={startup.problemStatement} />
          <ReviewField label="Solution" value={startup.solutionStatement} />
          <ReviewField label="Target audience" value={startup.targetAudience} />
          <ReviewField label="Build stage" value={startup.prototypeStatus} />
          <ReviewField label="Traction and evidence" value={startup.tractionEvidence} />
        </dl>
        <h3 className="text-sm font-semibold">Key features</h3>
        {metadata.features.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {metadata.features.map((feature, index) => (
              <li key={index} className="break-words rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <p className="font-semibold">{feature.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-gray-700">{feature.description}</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-600">No key features submitted.</p>}
      </ReviewSection>

      <ReviewSection title="Founders and team">
        <dl className="grid gap-4 sm:grid-cols-2">
          <ReviewField label="Founder display name" value={startup.founderName} />
          <ReviewField label="Submitted by" value={`${startup.founder.name}\n${startup.founder.email}`} />
        </dl>
        {startup.founders.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {startup.founders.map(founder => (
              <li key={founder.id} className="min-w-0 space-y-2 rounded-lg border border-gray-200 p-3 text-sm">
                <h3 className="break-words font-semibold">{founder.name}</h3>
                {founder.role && <p className="break-words text-gray-600">{founder.role}</p>}
                {founder.photoUrl && <ReviewImage url={founder.photoUrl} label={`Photo of ${founder.name}`} />}
                <div className="flex flex-wrap gap-3">
                  {founder.linkedinUrl && <ReviewLink url={founder.linkedinUrl}>LinkedIn</ReviewLink>}
                  {founder.twitterUrl && <ReviewLink url={founder.twitterUrl}>X / Twitter</ReviewLink>}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-600">No additional team members submitted.</p>}
      </ReviewSection>

      <ReviewSection title="Startup Wall">
        {startup.wallOptIn ? (
          <>
            <p className="text-sm text-gray-700">Opted in. Approving this submission also approves the proposed Wall image.</p>
            {wallImage ? (
              <div className="max-w-sm"><ReviewImage url={wallImage} label="Proposed Wall image" /></div>
            ) : <p className="text-sm text-gray-600">No Wall image available.</p>}
          </>
        ) : <p className="text-sm text-gray-700">This startup has opted out of the Wall.</p>}
      </ReviewSection>

      <ReviewSection title="Review decision">
        <StartupReviewActions id={startup.id} name={startup.name} returnToQueue />
      </ReviewSection>
    </div>
  );
}
