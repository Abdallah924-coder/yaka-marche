import type { Metadata } from "next";
import OrderList from "@/components/order-list";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Mes commandes",
  robots: { index: false, follow: false },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="site-shell orders-page">
        <p className="eyebrow">Achats et ventes</p>
        <h1>Mes commandes</h1>
        <p className="orders-intro">Retrouve ici tes achats, tes ventes et l’avancement de chaque échange.</p>
        {created === "1" && (
          <p className="order-success" role="status">
            Commande créée. Contacte le vendeur pour convenir du paiement et de la livraison.
          </p>
        )}
        <OrderList />
      </main>
    </>
  );
}
