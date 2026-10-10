"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { browserApiBaseUrl, formatPrice, type Listing } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";

function canBump(listing: Listing) {
  const lastBumped = listing.lastBumpedAt;
  const last = lastBumped || listing.createdAt;
  return Date.now() - new Date(last).getTime() >= 7 * 24 * 60 * 60 * 1000;
}

export default function MyListings() {
  const token = useAuthToken();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`${browserApiBaseUrl}/listings/mine`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de charger tes annonces.");
    setListings(Array.isArray(data.listings) ? data.listings : []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`${browserApiBaseUrl}/listings/mine`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de charger tes annonces.");
        if (active) setListings(Array.isArray(data.listings) ? data.listings : []);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function action(listing: Listing, kind: "delete" | "bump" | "status") {
    if (kind === "delete" && !window.confirm("Supprimer cette annonce définitivement ?")) return;
    setBusyId(listing.id);
    setError("");
    try {
      const url = kind === "bump"
        ? `${browserApiBaseUrl}/listings/${listing.id}/bump`
        : `${browserApiBaseUrl}/listings/${listing.id}`;
      const response = await fetch(url, {
        method: kind === "delete" ? "DELETE" : kind === "bump" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(kind === "status" ? {
          body: JSON.stringify({ status: listing.status === "active" ? "archive" : "active" }),
        } : {}),
      });
      const data = response.status === 204 ? {} : await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de mettre à jour l’annonce.");
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusyId("");
    }
  }

  if (!token) {
    return (
      <div className="catalog-message">
        <strong>Connecte-toi pour gérer tes annonces.</strong>
        <p>Retrouve ici tes articles publiés avec ton compte Yaka Marché.</p>
        <Link className="button button-primary" href="/connexion?redirect=%2Fmes-annonces">Se connecter</Link>
      </div>
    );
  }
  if (loading) return <div className="catalog-message">Chargement de tes annonces…</div>;

  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="seller-stats">
        <div><strong>{listings.length}</strong><span>Annonces publiées</span></div>
        <div><strong>{listings.filter((listing) => listing.featured).length}</strong><span>Mises en avant</span></div>
      </div>
      {listings.length === 0 ? (
        <div className="catalog-message">
          <strong>Tu n’as pas encore publié d’annonce.</strong>
          <p>Publie ton premier article pour le proposer aux acheteurs.</p>
          <Link className="button button-primary" href="/publier">Publier une annonce</Link>
        </div>
      ) : (
        <div className="seller-listings">
          {listings.map((listing) => (
            <article className="seller-listing-card" key={listing.id}>
              <div className="seller-listing-image">
                {listing.images?.[0] ? (
                  <Image src={listing.images[0]} alt={listing.title} width={160} height={130} unoptimized />
                ) : <span className="image-placeholder" aria-hidden="true">{listing.category}</span>}
              </div>
              <div className="seller-listing-info">
                <span className={`order-status ${listing.status === "active" ? "status-confirmed" : "status-cancelled"}`}>
                  {listing.status === "active" ? "En ligne" : listing.status === "vendu" ? "Vendu" : "Archivée"}
                </span>
                <h2>{listing.title}</h2>
                <strong>{formatPrice(listing.price)}</strong>
                <p>{listing.city} · {listing.views || 0} vues · {listing.contactClicks || 0} contacts</p>
              </div>
              <div className="seller-listing-actions">
                <Link className="button button-outline" href={`/produit/${encodeURIComponent(listing.id)}`}>Voir l’annonce</Link>
                {!listing.featured && (
                  <Link className="button button-light" href={`/mise-en-avant?id=${encodeURIComponent(listing.id)}`}>
                    Mettre en avant
                  </Link>
                )}
                <button className="button button-outline" disabled={busyId === listing.id || !canBump(listing)} onClick={() => action(listing, "bump")}>
                  Relancer
                </button>
                <button className="button button-outline" disabled={busyId === listing.id || listing.status === "vendu"} onClick={() => action(listing, "status")}>
                  {listing.status === "active" ? "Archiver" : "Remettre en ligne"}
                </button>
                <button className="button button-danger" disabled={busyId === listing.id} onClick={() => action(listing, "delete")}>
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
