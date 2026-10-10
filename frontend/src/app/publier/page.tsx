import type { Metadata } from "next";
import ListingForm from "@/components/listing-form";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Publier une annonce",
  description: "Publie gratuitement ton produit ou service sur Yaka Marché et contacte des acheteurs au Congo.",
  robots: { index: false, follow: true },
};

export default function PublishPage() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell publish-page">
        <p className="eyebrow">Vendre sur Yaka Marché</p>
        <h1>Publier une annonce</h1>
        <p className="publish-intro">Présente clairement ton article. Les acheteurs te contactent directement.</p>
        <section className="publish-panel">
          <ListingForm />
        </section>
      </main>
    </>
  );
}
