import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { SiteEnhancements } from "@/components/site/SiteEnhancements";
import { DEFAULT_SOCIAL_IMAGE, SITE_URL, absoluteUrl, PILOT_DESCRIPTION } from "@/lib/seo";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <div id="site-content" className="flex min-h-full flex-1 flex-col">
          {children}
          <SiteEnhancements />
        </div>
      </body>
    </html>
  );
}
