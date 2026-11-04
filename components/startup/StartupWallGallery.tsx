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

function sampleLogoColor(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const scale = 32 / Math.max(image.naturalWidth, image.naturalHeight);
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return;

  try {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const colors = new Map<number, { weight: number; red: number; green: number; blue: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const [red, green, blue, alpha] = data.subarray(i, i + 4);
      const darkest = Math.min(red, green, blue);
      if (alpha < 128 || darkest > 235) continue;

      // Group similar shades and favor brand colors over gray lettering.
      const key = (red >> 5) * 64 + (green >> 5) * 8 + (blue >> 5);
      const weight = (alpha / 255) * (1 + (Math.max(red, green, blue) - darkest) / 64);
      const color = colors.get(key) ?? { weight: 0, red: 0, green: 0, blue: 0 };
      color.weight += weight;
      color.red += red * weight;
      color.green += green * weight;
      color.blue += blue * weight;
      colors.set(key, color);
    }

    const dominant = [...colors.values()].sort((a, b) => b.weight - a.weight)[0];
    if (dominant) {
      const { red, green, blue, weight } = dominant;
      return `rgb(${Math.round(red / weight)} ${Math.round(green / weight)} ${Math.round(blue / weight)})`;
    }
  } catch {
    // Some image sources cannot be read by canvas. Keep the default tile color.
  }
}

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
  const [sample, setSample] = useState<{ url: string; color: string }>();
  const imageUrl = [startup.logoUrl, startup.wallImageUrl].find(url => url && !failedImages.includes(url));
  const tileStyle = sample && sample.url === imageUrl ? { "--tile-bg": `color-mix(in srgb, ${sample.color} 36%, white)` } as CSSProperties : undefined;
  const initials = startup.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();

  return <Link href={`/startups/${startup.slug}`} className={`${styles.tile} ${styles[`tile${size[0].toUpperCase()}${size.slice(1)}`]}`} style={tileStyle} aria-label={`Visit ${startup.name}`}>
    <span className={styles.tileMedia}>
      <span className={styles.logoFrame}>
        {!imageUrl ? <span className={styles.imageFallback}>{initials}</span> : (
          <Image
            key={imageUrl}
            src={imageUrl}
            alt=""
            fill
            sizes="152px"
            className={styles.logo}
            onLoad={event => {
              const color = sampleLogoColor(event.currentTarget);
              if (color) setSample({ url: imageUrl, color });
            }}
            onError={() => setFailedImages(previous => [...previous, imageUrl])}
          />
        )}
      </span>
    </span>
    <span className={styles.nameplate}><span className={styles.name}>{startup.name}</span>{startup.category && <span className={styles.category}>{startup.category}</span>}</span>
    {startup.spotlight && <span className={styles.spotlightFlag}>Spotlight · 24h</span>}
    <span className={styles.tileArrow} aria-hidden="true"><ArrowUpRight size={15} /></span>
  </Link>;
}
