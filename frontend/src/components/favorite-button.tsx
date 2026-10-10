"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthToken } from "@/lib/auth-session";
import { useFavorites } from "@/lib/favorites-store";

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const token = useAuthToken();
  const { ids, loaded, error: loadError, toggleFavorite } = useFavorites();
  const favorite = ids.has(listingId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      await toggleFavorite(listingId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <Link
        className="favorite-button"
        href={`/connexion?redirect=${encodeURIComponent(`/produit/${listingId}`)}`}
        aria-label="Connecte-toi pour enregistrer cette annonce"
        title="Se connecter pour ajouter aux favoris"
      >♡</Link>
    );
  }
  return (
    <button
      className={`favorite-button${favorite ? " is-favorite" : ""}`}
      type="button"
      aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={favorite}
      title={error || loadError || (favorite ? "Retirer des favoris" : "Ajouter aux favoris")}
      disabled={busy || !loaded || Boolean(loadError)}
      onClick={handleToggle}
    >
      {favorite ? "♥" : "♡"}
    </button>
  );
}
