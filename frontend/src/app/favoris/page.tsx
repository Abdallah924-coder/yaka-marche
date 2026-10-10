import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import FavoritesPage from "@/components/favorites-page";

export const metadata: Metadata = { title: "Mes favoris", robots: { index: false, follow: false } };

export default function FavoritesRoute() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell seller-page">
        <div className="seller-page-heading"><div><p className="eyebrow">Ta sélection</p><h1>Mes favoris</h1><p>Les annonces que tu as enregistrées.</p></div></div>
        <FavoritesPage />
      </main>
    </>
  );
}
