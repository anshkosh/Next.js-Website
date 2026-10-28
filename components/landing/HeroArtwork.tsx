import Image from "next/image";
import heroArtwork from "@/public/images/hero-dither-provided.png";
import styles from "./HeroArtwork.module.css";

export default function HeroArtwork() {
  return (
    <div className={styles.artwork} aria-hidden="true" data-hero-artwork>
      <div className={styles.frame}>
        <div className={styles.window}>
          {/* Use the original artwork with responsive, cached image delivery. */}
          <Image
            className={styles.base}
            src={heroArtwork}
            alt=""
            width={1672}
            height={941}
            sizes="(max-width: 639px) 610px, (max-width: 767px) 712px, (max-width: 819px) 820px, (max-width: 919px) 100vw, (max-width: 1023px) 920px, 100vw"
            quality={75}
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </div>
      <div className={styles.fade} />
    </div>
  );
}
