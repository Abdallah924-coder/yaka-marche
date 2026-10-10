"use client";

import Link from "next/link";
import { useAuthUser, useAuthToken } from "@/lib/auth-session";

const links = [
  { href: "/commandes", title: "Mes commandes", text: "Suivre les commandes et les confirmations de paiement." },
  { href: "/messages", title: "Mes messages", text: "Échanger avec les acheteurs et les annonceurs." },
  { href: "/mes-annonces", title: "Mes annonces", text: "Gérer, relancer et mettre en avant tes publications." },
  { href: "/favoris", title: "Mes favoris", text: "Retrouver les annonces enregistrées." },
  { href: "/alertes", title: "Mes alertes", text: "Recevoir un email pour les nouvelles annonces ciblées." },
  { href: "/parrainage", title: "Mon parrainage", text: "Partager ton lien et suivre tes crédits de mise en avant." },
];

export default function AccountHub() {
  const token = useAuthToken();
  const user = useAuthUser();
  if (!token) return <div className="catalog-message"><strong>Connecte-toi pour accéder à ton espace.</strong><Link className="button button-primary" href="/connexion?redirect=%2Fcompte">Se connecter</Link></div>;
  return (
    <>
      <div className="account-hub-grid">
        {links.map((item) => <Link className="account-hub-card" href={item.href} key={item.href}><strong>{item.title}</strong><span>{item.text}</span><b aria-hidden="true">→</b></Link>)}
        {user?.isAdmin && <Link className="account-hub-card" href="/admin"><strong>Administration</strong><span>Gérer les demandes payantes de mise en avant et les comptes.</span><b aria-hidden="true">→</b></Link>}
      </div>
    </>
  );
}
