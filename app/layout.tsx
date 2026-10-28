import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { SiteEnhancements } from "@/components/site/SiteEnhancements";
import { UnderConstructionBanner } from "@/components/site/UnderConstructionBanner";
import { PreEntryCurtain } from "@/components/site/PreEntryCurtain";
import { DEFAULT_SOCIAL_IMAGE, SITE_URL, absoluteUrl, PILOT_DESCRIPTION } from "@/lib/seo";
import { viewerSession } from "@/lib/viewer-session";
import { CURTAIN_SEEN_KEY } from "@/lib/curtain";
import { headers } from "next/headers";

const BASE_URL = SITE_URL;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Anshkosh | Explore Indian Startups and What Founders Are Building",
  description: PILOT_DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Anshkosh | Explore Indian Startups and What Founders Are Building",
    description: PILOT_DESCRIPTION,
    type: "website",
    url: BASE_URL,
    images: [{ url: absoluteUrl(DEFAULT_SOCIAL_IMAGE), alt: "Anshkosh startup discovery" }],
    siteName: "Anshkosh",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    images: [absoluteUrl(DEFAULT_SOCIAL_IMAGE)],
    title: "Anshkosh | Explore Indian Startups and What Founders Are Building",
    description: PILOT_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = Boolean(await viewerSession());
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
        {/* Hide the preview curtain before first paint once this session has entered. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem(${JSON.stringify(CURTAIN_SEEN_KEY)})==="1")document.documentElement.dataset.curtainSeen=""}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PreEntryCurtain authenticated={authenticated} />
        <div id="site-content" className="flex min-h-full flex-1 flex-col">
          <UnderConstructionBanner authenticated={authenticated} />
          {children}
          <SiteEnhancements />
        </div>
      </body>
    </html>
  );
}
