import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import AdminDashboard from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell admin-page">
        <div className="seller-page-heading">
          <div>
            <p className="eyebrow">Gestion de la marketplace</p>
            <h1>Administration</h1>
            <p>Valide les paiements de mise en avant et consulte les utilisateurs.</p>
          </div>
        </div>
        <AdminDashboard />
      </main>
    </>
  );
}
