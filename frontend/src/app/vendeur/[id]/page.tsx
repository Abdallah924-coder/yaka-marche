import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SellerProfile from "@/components/seller-profile";
import { browserApiBaseUrl } from "@/lib/listings";

type SellerPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const response = await fetch(`${browserApiBaseUrl}/sellers/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!response.ok) return { title: "Profil vendeur" };
    const data: { seller?: { name?: string; city?: string } } = await response.json();
    const name = data.seller?.name || "Vendeur";
    const description = `Consulte les annonces, les avis et le profil de ${name}${data.seller?.city ? ` à ${data.seller.city}` : ""} sur Yaka Marché.`;
    return {
      title: `${name} — profil vendeur`,
      description,
      alternates: { canonical: `/vendeur/${encodeURIComponent(id)}` },
      openGraph: { title: `${name} — Yaka Marché`, description },
    };
  } catch (error) {
    console.error("[marketplace] Failed to load seller metadata:", error);
    return { title: "Profil vendeur" };
  }
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main className="site-shell seller-page"><SellerProfile sellerId={id} /></main>
    </>
  );
}
