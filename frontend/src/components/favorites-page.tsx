"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ListingCard from "@/components/listing-card";
import { useFavorites } from "@/lib/favorites-store";
import { browserApiBaseUrl, type Listing } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";

export default function FavoritesPage() {
  const token = useAuthToken();
  const { toggleFavorite } = useFavorites();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`${browserApiBaseUrl}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de charger tes favoris.");
    setListings(Array.isArray(data.listings) ? data.listings : []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`${browserApiBaseUrl}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de charger tes favoris.");
        if (active) setListings(Array.isArray(data.listings) ? data.listings : []);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function remove(listingId: string) {
    setError("");
    try {
      await toggleFavorite(listingId);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    }
  }

  if (!token) return <div className="catalog-message"><strong>Connecte-toi pour retrouver tes annonces favorites.</strong><Link className="button button-primary" href="/connexion?redirect=%2Ffavoris">Se connecter</Link></div>;
  if (loading) return <div className="catalog-message">Chargement de tes favoris…</div>;
  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      {listings.length ? (
        <div className="listing-grid">
          {listings.map((listing) => (
            <div className="favorite-listing" key={listing.id}>
              <ListingCard listing={listing} />
              <button className="button button-outline favorite-remove" onClick={() => remove(listing.id)} type="button">Retirer des favoris</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="catalog-message"><strong>Aucun favori pour l’instant.</strong><p>Parcours les annonces et enregistre celles qui t’intéressent.</p><Link className="button button-outline" href="/annonces">Découvrir les annonces</Link></div>
      )}
    </>
  );
}
