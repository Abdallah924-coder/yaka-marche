import type { Metadata } from "next";
import Link from "next/link";
import MyListings from "@/components/my-listings";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Mes annonces vendeur",
  robots: { index: false, follow: false },
};

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ published?: string }>;
}) {
  const { published } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="site-shell seller-page">
        <div className="seller-page-heading">
          <div>
            <p className="eyebrow">Espace vendeur</p>
            <h1>Mes annonces</h1>
            <p>Gère tes publications et suis leur visibilité.</p>
          </div>
          <Link className="button button-primary" href="/publier">Publier une annonce</Link>
        </div>
        {published === "1" && <p className="order-success" role="status">Ton annonce a été publiée.</p>}
        <MyListings />
      </main>
    </>
  );
}
