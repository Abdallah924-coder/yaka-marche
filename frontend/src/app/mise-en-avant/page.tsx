import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import BoostForm from "@/components/boost-form";

export const metadata: Metadata = {
  title: "Mettre une annonce en avant",
  robots: { index: false, follow: false },
};

export default async function BoostPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="site-shell boost-page">
        <div className="seller-page-heading">
          <div>
            <p className="eyebrow">Visibilité vendeur</p>
            <h1>Mettre en avant ton annonce</h1>
            <p>Elle apparaîtra en priorité après validation de ton paiement par l’équipe Yaka Marché.</p>
          </div>
        </div>
        <BoostForm listingId={id || ""} />
      </main>
    </>
  );
}
