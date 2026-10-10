import type { Metadata, Viewport } from "next";
import FavoritesProvider from "@/components/favorites-provider";
import LegacyServiceWorkerCleanup from "@/components/legacy-service-worker-cleanup";
import SiteFooter from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yaka-marche.xyz"),
  title: {
    default: "Yaka Marché — La marketplace locale du Congo",
    template: "%s | Yaka Marché",
  },
  description:
    "Achète et vends près de chez toi. Découvre les annonces et contacte directement les vendeurs au Congo sur Yaka Marché.",
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Yaka Marché",
    title: "Yaka Marché — La marketplace locale du Congo",
    description:
      "Achète et vends près de chez toi. Découvre les annonces et contacte directement les vendeurs au Congo.",
    url: "/",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yaka Marché — La marketplace locale du Congo",
    description: "Achète et vends près de chez toi, partout au Congo.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [{ url: "/brand-mark.svg", type: "image/svg+xml" }],
    apple: "/icons/brand-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f5ef",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Yaka Marché",
        url: "https://yaka-marche.xyz",
        logo: "https://yaka-marche.xyz/brand-mark.svg",
      },
      {
        "@type": "WebSite",
        name: "Yaka Marché",
        url: "https://yaka-marche.xyz",
        inLanguage: "fr",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://yaka-marche.xyz/annonces?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        <LegacyServiceWorkerCleanup />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <FavoritesProvider>
          {children}
          <SiteFooter />
        </FavoritesProvider>
      </body>
    </html>
  );
}
