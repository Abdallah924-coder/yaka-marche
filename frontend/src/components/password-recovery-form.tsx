"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { browserApiBaseUrl } from "@/lib/listings";

export default function PasswordRecoveryForm({ token }: { token?: string }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const password = String(form.get("password") || "");
    if (token && password !== String(form.get("confirmPassword") || "")) {
      setBusy(false); setError("Les mots de passe ne correspondent pas."); return;
    }
    try {
      const response = await fetch(`${browserApiBaseUrl}/auth/${token ? "reset-password" : "forgot-password"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { token, password } : { email: form.get("email") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
      setSuccess(token
        ? "Ton mot de passe a été modifié. Tu peux maintenant te connecter."
        : "Si cette adresse correspond à un compte, un email de réinitialisation a été envoyé.");
      formElement.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally { setBusy(false); }
  }

  return (
    <main className="account-page">
      <Link className="brand" href="/" aria-label="Yaka Marché, accueil"><span className="brand-mark">Y</span><span>Yaka <b>Marché</b></span></Link>
      <section className="account-card">
        <p className="eyebrow">Sécurité du compte</p>
        <h1>{token ? "Nouveau mot de passe" : "Mot de passe oublié ?"}</h1>
        <p className="account-intro">{token ? "Choisis un nouveau mot de passe pour accéder à ton compte." : "Saisis l’adresse email de ton compte. Nous t’enverrons un lien valable une heure si le compte existe."}</p>
        <form className="account-form" onSubmit={submit}>
          {token ? (
            <>
              <label htmlFor="new-password">Nouveau mot de passe</label>
              <input id="new-password" name="password" type="password" required minLength={6} autoComplete="new-password" />
              <label htmlFor="confirm-password">Confirmer le mot de passe</label>
              <input id="confirm-password" name="confirmPassword" type="password" required minLength={6} autoComplete="new-password" />
            </>
          ) : (
            <>
              <label htmlFor="recovery-email">Adresse e-mail</label>
              <input id="recovery-email" name="email" type="email" autoComplete="email" required />
            </>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          {success && <p className="order-success" role="status">{success}</p>}
          <button className="button button-primary account-submit" type="submit" disabled={busy}>{busy ? "Patiente un instant…" : token ? "Modifier le mot de passe" : "Envoyer le lien"}</button>
        </form>
        {token && success ? <Link className="button button-outline" href="/connexion">Se connecter</Link> : <p className="account-switch"><Link href="/connexion">Retour à la connexion</Link></p>}
      </section>
    </main>
  );
}
