import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

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
  description: "Discover Indian startups before launch, examine what they can prove, and follow the teams turning early demand into measurable traction.",
  openGraph: {
    title: "Anshkosh | Discover Indian Startups Before Launch",
    description: "Explore startup evidence, launch plans, and founder progress before backing opens.",
    type: "website",
    url: "https://www.anshkosh.com/",
    siteName: "Anshkosh",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anshkosh | Discover Indian Startups Before Launch",
    description: "Explore startup evidence, launch plans, and founder progress before backing opens.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
