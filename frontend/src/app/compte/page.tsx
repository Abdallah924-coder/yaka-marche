import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import AccountHub from "@/components/account-hub";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell seller-page"><div className="seller-page-heading"><div><p className="eyebrow">Ton activité</p><h1>Mon espace</h1><p>Retrouve au même endroit tes achats, tes ventes et tes outils marketplace.</p></div></div><AccountHub /></main>
    </>
  );
}
