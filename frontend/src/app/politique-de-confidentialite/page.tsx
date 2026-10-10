import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Yaka Marché collecte et protège les données personnelles.",
  alternates: { canonical: "/politique-de-confidentialite" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="site-shell legal-page">
        <p className="eyebrow">Données personnelles</p><h1>Politique de confidentialité</h1><p className="muted-copy">Dernière mise à jour : août 2026.</p>
        <section className="legal-content">
          <h2>Données collectées</h2><p>Lors de la création d’un compte : nom, adresse email, téléphone, ville et mot de passe stocké sous forme hachée. Les annonces contiennent les informations et photos fournies par leurs auteurs. Les commandes peuvent contenir des coordonnées et des informations de paiement déclarées. Une demande de mise en avant contient une capture de preuve de paiement. Nous ne demandons ni ne stockons les identifiants Mobile Money ou les clés de portefeuille crypto.</p>
          <h2>Utilisation des données</h2><p>Ces données servent à créer et gérer les comptes, publier des annonces, permettre les échanges entre acheteurs et vendeurs, gérer les commandes et paiements manuels, les favoris, avis, parrainages et alertes email. Le téléphone peut être affiché avec une annonce lorsque l’utilisateur le fournit à cette fin.</p>
          <h2>Emails</h2><p>Des emails transactionnels (bienvenue, annonces, mise en avant, alertes de recherche et réinitialisation de mot de passe) peuvent être envoyés via Brevo. Aucun email marketing n’est envoyé sans consentement explicite.</p>
          <h2>Stockage local et sessions</h2><p>La session est conservée dans le stockage local du navigateur. Le site ne doit jamais demander ton mot de passe ou tes codes Mobile Money par message. Les services d’hébergement et les réglages analytiques éventuels peuvent appliquer leurs propres mécanismes techniques.</p>
          <h2>Partage</h2><p>Les données ne sont pas vendues. Elles sont traitées par les prestataires nécessaires au service, notamment MongoDB Atlas (base de données), Render (hébergement) et Brevo (emails). Les informations d’annonce sont visibles aux visiteurs selon les choix de publication de la plateforme.</p>
          <h2>Conservation et sécurité</h2><p>Les informations sont conservées aussi longtemps que nécessaire au fonctionnement du compte et aux obligations applicables. Les mots de passe sont hachés avec bcrypt, et les échanges avec la plateforme sont servis en HTTPS en production.</p>
          <h2>Vos droits et contact</h2><p>Pour demander l’accès, la correction ou la suppression de tes données, écris à <a href="mailto:yaka.support@gmail.com">yaka.support@gmail.com</a>.</p>
        </section>
        <Link className="text-link" href="/mentions-legales">Consulter les mentions légales →</Link>
      </main>
    </>
  );
}
