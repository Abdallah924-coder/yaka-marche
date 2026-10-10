import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import ReferralPanel from "@/components/referral-panel";

export const metadata: Metadata = { title: "Mon parrainage", robots: { index: false, follow: false } };

export default function ReferralPage() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell seller-page">
        <div className="seller-page-heading"><div><p className="eyebrow">Fais grandir la communauté</p><h1>Mon parrainage</h1><p>Invite de nouveaux vendeurs et gagne des crédits de mise en avant.</p></div></div>
        <ReferralPanel />
      </main>
    </>
  );
}
