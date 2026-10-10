"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { browserApiBaseUrl, categories } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";
import CitySuggestions from "@/components/city-suggestions";

type SearchAlert = { id: string; category: string; city: string; keyword: string; createdAt: string };

export default function AlertsManager({
  initialCategory,
  initialCity,
  initialKeyword,
}: {
  initialCategory: string;
  initialCity: string;
  initialKeyword: string;
}) {
  const token = useAuthToken();
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`${browserApiBaseUrl}/alerts`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de charger tes alertes.");
        if (active) setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  if (!token) return <div className="catalog-message"><strong>Connecte-toi pour gérer tes alertes.</strong><Link className="button button-primary" href="/connexion?redirect=%2Falertes">Se connecter</Link></div>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${browserApiBaseUrl}/alerts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ category, city: city.trim(), keyword: keyword.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de créer cette alerte.");
      setAlerts((current) => [data.alert, ...current]);
      setNotice("Alerte créée. Tu recevras un email lors d’une nouvelle annonce correspondante.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally { setBusy(false); }
  }

  async function remove(alertId: string) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${browserApiBaseUrl}/alerts/${encodeURIComponent(alertId)}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de supprimer cette alerte.");
      setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally { setBusy(false); }
  }

  return (
    <div className="account-tools">
      <form className="tools-panel account-form" onSubmit={submit}>
        <h2>Créer une alerte</h2>
        <label htmlFor="alert-category">Catégorie</label>
        <select id="alert-category" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="Toutes">Toutes catégories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <label htmlFor="alert-city">Ville (facultatif)</label>
        <input id="alert-city" list="congo-cities" value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} placeholder="Brazzaville ou Pointe-Noire" />
        <CitySuggestions id="congo-cities" />
        <label htmlFor="alert-keyword">Mot-clé (facultatif)</label>
        <input id="alert-keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} maxLength={100} placeholder="Téléphone, appartement…" />
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="order-success" role="status">{notice}</p>}
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Créer l’alerte"}</button>
      </form>
      <section className="tools-panel">
        <h2>Alertes actives ({alerts.length}/10)</h2>
        {loading ? <p className="muted-copy">Chargement…</p> : alerts.length === 0 ? <p className="muted-copy">Aucune alerte pour le moment.</p> : (
          <div className="alert-list">
            {alerts.map((alert) => (
              <article className="alert-row" key={alert.id}>
                <div><strong>{alert.category === "Toutes" ? "Toutes catégories" : alert.category}{alert.city ? ` · ${alert.city}` : ""}</strong><p>{alert.keyword ? `Mot-clé : ${alert.keyword}` : "Sans mot-clé"} · créée le {new Date(alert.createdAt).toLocaleDateString("fr-FR")}</p></div>
                <button className="button button-outline" type="button" disabled={busy} onClick={() => remove(alert.id)}>Supprimer</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
