import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Yaka Marché.",
  alternates: { canonical: "/mentions-legales" },
};

export default function LegalNoticePage() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell legal-page">
        <p className="eyebrow">Informations juridiques</p><h1>Mentions légales</h1><p className="muted-copy">Dernière mise à jour : août 2026.</p>
        <section className="legal-content">
          <h2>Éditeur du site</h2><p>Le site Yaka Marché (yaka-marche.xyz) est édité par <strong>WORLDIFYAI</strong>. Contact : <a href="mailto:d6vli.spam@gmail.com">d6vli.spam@gmail.com</a>.</p>
          <h2>Directeur de publication</h2><p>MICHY DEVOUE.</p>
          <h2>Hébergement</h2><p>Le site est hébergé par Render Services, Inc., 525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis (<a href="https://render.com" target="_blank" rel="noreferrer">render.com</a>). La base de données est hébergée par MongoDB Atlas (MongoDB, Inc.), 1633 Broadway, New York, NY 10019, États-Unis.</p>
          <h2>Nature du service et transactions</h2><p>Yaka Marché est une plateforme de mise en relation entre acheteurs et vendeurs au Congo. Les paiements de commandes sont convenus et réalisés directement entre les utilisateurs. Pour les mises en avant, le vendeur effectue un paiement manuel et transmet une preuve, vérifiée par un administrateur avant activation. Yaka Marché ne garantit ni la qualité, ni la conformité, ni la livraison des biens et services proposés.</p>
          <h2>Contenu publié</h2><p>Chaque utilisateur est responsable du contenu qu’il publie. Yaka Marché peut retirer une annonce contraire à la loi ou aux règles applicables de la plateforme.</p>
          <h2>Propriété intellectuelle</h2><p>La marque Yaka Marché, son logo et sa charte graphique sont la propriété de WORLDIFYAI. Les photos d’annonces restent la propriété de leurs auteurs.</p>
          <h2>Contact</h2><p>Pour toute question relative aux présentes mentions : <a href="mailto:yaka.support@gmail.com">yaka.support@gmail.com</a>.</p>
        </section>
        <Link className="text-link" href="/politique-de-confidentialite">Consulter la politique de confidentialité →</Link>
      </main>
    </>
  );
}
