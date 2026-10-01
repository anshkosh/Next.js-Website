import Image from "next/image";
import styles from "./HeroArtwork.module.css";

export default function HeroArtwork() {
  return (
    <div className={styles.artwork} aria-hidden="true" data-hero-artwork>
      <div className={styles.frame}>
        <div className={styles.window}>
          {/* Keep the supplied bitmap intact, including its original dithering. */}
          <Image
            className={styles.base}
            src="/images/hero-dither-provided.png"
            alt=""
            width={1672}
            height={941}
            unoptimized
            preload
          />
        </div>
      </div>
      <div className={styles.fade} />
    </div>
  );
}
