"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { browserApiBaseUrl } from "@/lib/listings";
import { notifyAuthChanged } from "@/lib/auth-session";
import { isSafeInternalPath } from "@/lib/urls";

export default function AccountForm({
  mode,
  redirectTo,
  referralCode,
}: {
  mode: "login" | "register";
  redirectTo?: string;
  referralCode?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch(
        `${browserApiBaseUrl}/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de se connecter.");
      if (!data.token || !data.user) throw new Error("Réponse de connexion invalide.");

      localStorage.setItem("yaka_token", data.token);
      localStorage.setItem("yaka_user", JSON.stringify(data.user));
      notifyAuthChanged();
      router.replace(isSafeInternalPath(redirectTo) ? redirectTo : "/commandes");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page">
      <Link className="brand" href="/" aria-label="Yaka Marché, accueil">
        <span className="brand-mark" aria-hidden="true">Y</span>
        <span>Yaka <b>Marché</b></span>
      </Link>
      <section className="account-card">
        <p className="eyebrow">{isRegister ? "Rejoindre le marché" : "Ravi de te revoir"}</p>
        <h1>{isRegister ? "Créer un compte" : "Se connecter"}</h1>
        <p className="account-intro">
          {isRegister
            ? "Crée ton compte pour commander, vendre et suivre tes échanges."
            : "Connecte-toi pour passer une commande ou retrouver tes ventes."}
        </p>
        <form className="account-form" onSubmit={submit}>
          {isRegister && referralCode && (
            <input type="hidden" name="ref" value={referralCode} />
          )}
          {isRegister && (
            <>
              <label htmlFor="account-name">Nom complet</label>
              <input id="account-name" name="name" autoComplete="name" required maxLength={100} />
            </>
          )}
          <label htmlFor="account-email">Adresse e-mail</label>
          <input id="account-email" name="email" type="email" autoComplete="email" required />
          {isRegister && (
            <>
              <label htmlFor="account-phone">Téléphone</label>
              <input id="account-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} />
              <label htmlFor="account-city">Ville</label>
              <input id="account-city" name="city" autoComplete="address-level2" maxLength={100} />
            </>
          )}
          <label htmlFor="account-password">Mot de passe</label>
          <input
            id="account-password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 6 : undefined}
          />
          {!isRegister && <Link className="text-link password-help" href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary account-submit" type="submit" disabled={busy}>
            {busy ? "Patiente un instant..." : isRegister ? "Créer mon compte" : "Me connecter"}
          </button>
        </form>
        <p className="account-switch">
          {isRegister ? "Tu as déjà un compte ?" : "Tu n’as pas encore de compte ?"}{" "}
          <Link href={`${isRegister ? "/connexion" : "/inscription"}${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}>
            {isRegister ? "Se connecter" : "Créer un compte"}
          </Link>
        </p>
      </section>
      <p className="account-footnote">Ton compte est également reconnu par la plateforme Yaka Marché actuelle.</p>
    </main>
  );
}
