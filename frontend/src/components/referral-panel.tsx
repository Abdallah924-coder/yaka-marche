"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { browserApiBaseUrl } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";

type ReferralData = { code: string; referralCount: number; freeBoostCredits: number; threshold: number; progress: number };

const subscribeToOrigin = () => () => {};
const getOriginSnapshot = () => window.location.origin;

export default function ReferralPanel() {
  const token = useAuthToken();
  const [data, setData] = useState<ReferralData | null>(null);
  const origin = useSyncExternalStore(subscribeToOrigin, getOriginSnapshot, () => "");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`${browserApiBaseUrl}/referrals/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Impossible de charger ton parrainage.");
        if (active) setData(body);
      })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue."); });
    return () => { active = false; };
  }, [token]);

  if (!token) return <div className="catalog-message"><strong>Connecte-toi pour retrouver ton lien de parrainage.</strong><Link className="button button-primary" href="/connexion?redirect=%2Fparrainage">Se connecter</Link></div>;
  if (error) return <div className="catalog-message" role="alert">{error}</div>;
  if (!data) return <div className="catalog-message">Chargement de ton parrainage…</div>;

  const referralUrl = `${origin}/inscription?ref=${encodeURIComponent(data.code)}`;
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
    } catch {
      setError("Impossible de copier automatiquement le lien. Sélectionne-le pour le copier.");
    }
  }

  return (
    <div className="referral-panel">
      <div className="referral-stat-grid"><div><strong>{data.referralCount}</strong><span>Personnes parrainées</span></div><div><strong>{data.freeBoostCredits}</strong><span>Crédits de mise en avant</span></div></div>
      <section className="tools-panel">
        <h2>Ton lien personnel</h2><p>Partage ce lien. Chaque {data.threshold} nouveaux inscrits parrainés te rapporte un crédit gratuit de mise en avant.</p>
        <div className="referral-link-row"><input aria-label="Lien de parrainage" readOnly value={referralUrl} onFocus={(event) => event.currentTarget.select()} /><button className="button button-primary" type="button" onClick={copyLink}>{copied ? "Lien copié" : "Copier le lien"}</button></div>
        <div className="referral-progress"><span>{data.progress} / {data.threshold} vers le prochain crédit</span><div><i style={{ width: `${Math.min(100, data.progress / data.threshold * 100)}%` }} /></div></div>
      </section>
    </div>
  );
}
