import type { MetadataRoute } from "next";
import { getListings } from "@/lib/listings";

const baseUrl = "https://yaka-marche.xyz";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/annonces`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/politique-de-confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const listings = await getListings();
    pages.push(
      ...listings
        .filter((listing) => listing.status === "active")
        .map((listing) => ({
          url: `${baseUrl}/produit/${encodeURIComponent(listing.id)}`,
          lastModified: listing.createdAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
    );
    const sellers = [...new Set(listings.filter((listing) => listing.status === "active" && listing.ownerId).map((listing) => String(listing.ownerId)))];
    pages.push(...sellers.map((sellerId) => ({
      url: `${baseUrl}/vendeur/${encodeURIComponent(sellerId)}`,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })));
  } catch (error) {
    console.error("[marketplace] Failed to load sitemap listings:", error);
  }

  return pages;
}
