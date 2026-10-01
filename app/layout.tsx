import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { SiteEnhancements } from "@/components/site/SiteEnhancements";
import { UnderConstructionBanner } from "@/components/site/UnderConstructionBanner";
import { PreEntryCurtain } from "@/components/site/PreEntryCurtain";
import { DEFAULT_SOCIAL_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";

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
  title: "Anshkosh | Discover Indian Startups Before Launch",
  description: "Anshkosh helps you discover Indian startups before launch, examine what they can prove, and follow founder progress.",
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Anshkosh | Discover Indian Startups Before Launch",
    description: "Explore Anshkosh startup evidence, launch plans, and founder progress before backing opens.",
    type: "website",
    url: BASE_URL,
    images: [{ url: absoluteUrl(DEFAULT_SOCIAL_IMAGE), alt: "Anshkosh startup discovery" }],
    siteName: "Anshkosh",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    images: [absoluteUrl(DEFAULT_SOCIAL_IMAGE)],
    title: "Anshkosh | Discover Indian Startups Before Launch",
    description: "Explore Anshkosh startup evidence, launch plans, and founder progress before backing opens.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("anshkosh-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        <PreEntryCurtain />
        <div id="site-content" className="flex min-h-full flex-1 flex-col">
          <UnderConstructionBanner />
          {children}
          <SiteEnhancements />
        </div>
      </body>
    </html>
  );
}
