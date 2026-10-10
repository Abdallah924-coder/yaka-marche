import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import AlertsManager from "@/components/alerts-manager";

export const metadata: Metadata = { title: "Mes alertes", robots: { index: false, follow: false } };

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; keyword?: string; q?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="site-shell seller-page">
        <div className="seller-page-heading"><div><p className="eyebrow">Reste informé</p><h1>Mes alertes</h1><p>Reçois un email lorsqu’une nouvelle annonce correspond à tes critères.</p></div></div>
        <AlertsManager initialCategory={params.category || "Toutes"} initialCity={params.city || ""} initialKeyword={params.keyword || params.q || ""} />
      </main>
    </>
  );
}
