export type Listing = {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  city: string;
  phone: string;
  images: string[];
  featured: boolean;
  status: string;
  createdAt: string;
  lastBumpedAt?: string | null;
  views?: number;
  contactClicks?: number;
  owner?: {
    id?: string;
    name?: string;
    ratingAvg?: number;
    ratingCount?: number;
  };
  ownerId?: string;
};

const apiBaseUrl = (
  process.env.MARKETPLACE_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yaka-marche.xyz/api"
).replace(/\/$/, "");

export const browserApiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "https://yaka-marche.xyz/api"
).replace(/\/$/, "");

export async function getListings(params: {
  search?: string;
  category?: string;
  sort?: string;
} = {}): Promise<Listing[]> {
  const url = new URL(`${apiBaseUrl}/listings`);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.sort) url.searchParams.set("sort", params.sort);

  const response = await fetch(url, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`Catalogue indisponible (HTTP ${response.status}).`);
  }

  const data: { listings?: Listing[] } = await response.json();
  if (!Array.isArray(data.listings)) {
    throw new Error("La réponse du catalogue est invalide.");
  }

  return data.listings;
}

export const getListing = cache(async (id: string): Promise<Listing | null> => {
  const response = await fetch(
    `${apiBaseUrl}/listings/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Annonce indisponible (HTTP ${response.status}).`);
  }

  const data: { listing?: Listing } = await response.json();
  return data.listing || null;
});

export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(price)} FCFA`;
}

export const categories = [
  "Services",
  "Electronique",
  "Mode",
  "Immobilier",
  "Vehicules",
  "Cours & Formation",
  "Maison & Meubles",
  "Alimentation",
  "Beaute & Bien-etre",
  "Sport & Loisirs",
  "Emploi",
  "Bebe & Enfants",
  "Agriculture & Elevage",
  "Autre",
];
import { cache } from "react";
