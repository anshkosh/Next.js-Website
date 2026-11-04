"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import styles from "@/app/(public)/startup-wall/page.module.css";

interface WallStartup {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  logoUrl: string | null;
  wallImageUrl: string;
  spotlight: boolean;
}

const mosaicSizes = ["wide", "small", "tall", "small", "large", "small", "wide", "small", "tall", "small", "large", "small"] as const;

export default function StartupWallGallery({ items, promoteHref }: { items: WallStartup[]; promoteHref: string | null }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(items.map(item => item.category))].sort((a, b) => a.localeCompare(b)), [items]);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items.filter(item => (category === "all" || item.category === category) &&
      (!term || `${item.name} ${item.tagline} ${item.category}`.toLocaleLowerCase().includes(term)));
  }, [category, items, search]);

  return <main className={styles.page}>
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/startup-wall"><span className={styles.brandMark} aria-hidden="true">A</span><span>ANSHKOSH <b>STARTUP WALL</b></span></Link>
      <nav className={styles.topLinks} aria-label="Startup Wall"><a href="#mosaic">The wall</a><a href="#browse">Browse startups</a>{promoteHref && <Link href={promoteHref}>Add your startup <ArrowUpRight aria-hidden="true" size={15} /></Link>}</nav>
    </header>

    <section className={styles.intro} aria-labelledby="wall-heading">
      <div><p className={styles.kicker}>A growing canvas of ideas</p><h1 id="wall-heading">The Startup Wall</h1><p className={styles.introText}>Every tile is a startup. Find something new, meet the founders, and explore what they’re building.</p></div>
      <div className={styles.wallCount}><strong>{items.length}</strong><span>startups<br />on the wall</span></div>
    </section>

    <section id="mosaic" className={styles.mosaicSection} aria-label="Startup mosaic">
      {filtered.length ? <div className={styles.mosaic}>
        {filtered.map((startup, index) => <StartupTile key={startup.id} startup={startup} size={startup.spotlight ? "spotlight" : mosaicSizes[index % mosaicSizes.length]} />)}
      </div> : items.length ? <div className={styles.emptyState}><p>No startups match those filters.</p><button type="button" onClick={() => { setSearch(""); setCategory("all"); }}>Clear filters</button></div> : <div className={styles.emptyState}><p>The wall is ready for its first startup.</p><span>Approved startups will show up here.</span></div>}
    </section>

    <section id="browse" className={styles.browseBar} aria-label="Find startups">
      <div><p className={styles.browseTitle}>Find your next favorite</p><span className={styles.results} aria-live="polite">Showing {filtered.length} of {items.length} startups</span></div>
      <div className={styles.filters}>
        <label className={styles.searchBox}><Search aria-hidden="true" size={17} /><span className="sr-only">Search startups</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search names or ideas" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}</label>
        <label className={styles.categoryFilter}><span className="sr-only">Filter by category</span><select value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter startups by category"><option value="all">All categories</option>{categories.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
      </div>
    </section>
  </main>;
}

function StartupTile({ startup, size }: { startup: WallStartup; size: typeof mosaicSizes[number] | "spotlight" }) {
  const imageUrl = startup.wallImageUrl || startup.logoUrl;
  const [imageFailed, setImageFailed] = useState(false);
  const initials = startup.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();

  return <Link href={`/startups/${startup.slug}`} className={`${styles.tile} ${styles[`tile${size[0].toUpperCase()}${size.slice(1)}`]}`} aria-label={`${startup.name}${startup.category ? `, ${startup.category}` : ""}`}>
    {imageFailed || !imageUrl ? <span className={styles.imageFallback}>{initials}</span> : <Image src={imageUrl} alt="" fill sizes="(min-width: 1100px) 25vw, (min-width: 700px) 33vw, 50vw" className={startup.wallImageUrl ? styles.creative : styles.logo} onError={() => setImageFailed(true)} />}
    <span className={styles.nameplate}><span className={styles.name}>{startup.name}</span>{startup.category && <span className={styles.category}>{startup.category}</span>}</span>
    {startup.spotlight && <span className={styles.spotlightFlag}>Spotlight · 24h</span>}
    <span className={styles.tileArrow} aria-hidden="true"><ArrowUpRight size={15} /></span>
  </Link>;
}
