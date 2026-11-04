"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PublicPageIntro from "@/components/layout/PublicPageIntro";
import styles from "@/app/(public)/startup-wall/page.module.css";

interface WallStartup {
  id: string;
  name: string;
  slug: string;
  category: string;
  logoUrl: string | null;
  wallImageUrl: string;
  spotlight: boolean;
}

const mosaicSizes = ["wide", "small", "tall", "small", "large", "small", "wide", "small", "tall", "small", "large", "small"] as const;

export default function StartupWallGallery({ items, promoteHref }: { items: WallStartup[]; promoteHref: string | null }) {
  const logoSize = Math.round(Math.max(96, Math.min(152, 152 * Math.sqrt(14 / Math.max(1, items.length)))));

  return <div className={styles.page}>
    <PublicPageIntro compact title={<>Anshkosh Startup <span className="text-coral-500">Wall</span></>} />
    {promoteHref && <div className={styles.wallToolbar}>
      <Link href={promoteHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-coral-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600">
        Promote your startup
      </Link>
    </div>}

    <section id="mosaic" className={styles.mosaicSection} aria-label="Startup mosaic">
      {items.length ? <div className={styles.mosaic} style={{ "--wall-logo-size": `${logoSize}px` } as CSSProperties}>
        {items.map((startup, index) => <StartupTile key={startup.id} startup={startup} size={startup.spotlight ? "spotlight" : mosaicSizes[index % mosaicSizes.length]} />)}
      </div> : <div className={styles.emptyState}><p>The wall is ready for its first startup.</p><span>Approved startups will show up here.</span></div>}
    </section>
  </div>;
}

function StartupTile({ startup, size }: { startup: WallStartup; size: typeof mosaicSizes[number] | "spotlight" }) {
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const imageUrl = [startup.logoUrl, startup.wallImageUrl].find(url => url && !failedImages.includes(url));
  const initials = startup.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();

  return <Link href={`/startups/${startup.slug}`} className={`${styles.tile} ${styles[`tile${size[0].toUpperCase()}${size.slice(1)}`]}`} aria-label={`${startup.name}${startup.category ? `, ${startup.category}` : ""}`}>
    <span className={styles.tileMedia}>
      <span className={styles.logoFrame}>
        {!imageUrl ? <span className={styles.imageFallback}>{initials}</span> : (
          <Image key={imageUrl} src={imageUrl} alt="" fill sizes="152px" className={styles.logo} onError={() => setFailedImages(previous => [...previous, imageUrl])} />
        )}
      </span>
    </span>
    <span className={styles.nameplate}><span className={styles.name}>{startup.name}</span>{startup.category && <span className={styles.category}>{startup.category}</span>}</span>
    {startup.spotlight && <span className={styles.spotlightFlag}>Spotlight · 24h</span>}
    <span className={styles.tileArrow} aria-hidden="true"><ArrowUpRight size={15} /></span>
  </Link>;
}
