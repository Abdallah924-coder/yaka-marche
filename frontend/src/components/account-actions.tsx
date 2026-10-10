"use client";

import Link from "next/link";
import { notifyAuthChanged, useAuthToken, useAuthUser } from "@/lib/auth-session";

export default function AccountActions() {
  const token = useAuthToken();
  const user = useAuthUser();

  function logout() {
    localStorage.removeItem("yaka_token");
    localStorage.removeItem("yaka_user");
    notifyAuthChanged();
  }

  return (
    <nav className="header-actions" aria-label="Compte et vente">
      {token ? (
        <>
          <Link className="header-login header-account-home" href="/compte">Mon espace</Link>
          <Link className="header-login" href="/commandes">Mes commandes</Link>
          <Link className="header-login" href="/messages">Messages</Link>
          <Link className="header-login" href="/mes-annonces">Mes annonces</Link>
          <Link className="header-login" href="/favoris">Favoris</Link>
          <Link className="header-login" href="/alertes">Alertes</Link>
          <Link className="header-login" href="/parrainage">Parrainage</Link>
          {user?.isAdmin && <Link className="header-login" href="/admin">Administration</Link>}
          <button className="header-logout" onClick={logout} type="button">Déconnexion</button>
        </>
      ) : (
        <>
          <Link className="header-login" href="/connexion">Se connecter</Link>
          <Link className="header-login" href="/inscription">Créer un compte</Link>
        </>
      )}
      <Link className="button button-primary button-compact" href="/publier">
        Vendre un article
      </Link>
    </nav>
  );
}
