import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroller from "@/components/layout/SmoothScroller";
import CustomCursor from "@/components/ui/CustomCursor";
import { constructMetadata, siteConfig } from "@/config/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = constructMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author,
    url: siteConfig.url,
    sameAs: [siteConfig.links.twitter, siteConfig.links.github],
    jobTitle: "Developer & Designer",
    worksFor: {
      "@type": "Organization",
      name: "shafwan.in"
    }
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-full flex flex-col cursor-none">
        <CustomCursor />
        <SmoothScroller>
          <main className="relative z-10 flex flex-col min-h-screen">
            {children}
          </main>
        </SmoothScroller>
      </body>
    </html>
  );
}
