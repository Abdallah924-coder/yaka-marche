import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrderCheckout from "@/components/order-checkout";
import SiteHeader from "@/components/site-header";
import { formatPrice, getListing } from "@/lib/listings";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await params;
  return {
    title: "Passer commande",
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: PageProps) {
  const { id } = await params;
  let listing;
  try {
    listing = await getListing(id);
  } catch (error) {
    console.error("[marketplace] Failed to load listing for checkout:", error);
    return (
      <>
        <SiteHeader />
        <main className="site-shell checkout-page">
          <div className="catalog-message">
            <h1>Commande momentanément indisponible</h1>
            <p>Impossible de récupérer cette annonce. Réessaie dans quelques instants.</p>
          </div>
        </main>
      </>
    );
  }
  if (!listing || listing.status !== "active") notFound();

  return (
    <>
      <SiteHeader />
      <main className="site-shell checkout-page">
        <p className="eyebrow">Finaliser mon achat</p>
        <h1>Passer commande</h1>
        <div className="checkout-layout">
          <section className="checkout-item">
            <p className="listing-category">Résumé de l’article</p>
            <h2>{listing.title}</h2>
            <p>{listing.city} · {listing.category}</p>
            <strong>{formatPrice(listing.price)} <span>/ unité</span></strong>
          </section>
          <section className="checkout-panel" aria-label="Informations de commande">
            <OrderCheckout listing={listing} />
          </section>
        </div>
      </main>
    </>
  );
}
