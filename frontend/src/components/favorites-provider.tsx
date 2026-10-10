"use client";

import { ReactNode, useEffect } from "react";
import { loadFavorites, setFavoritesLoadError } from "@/lib/favorites-store";
import { useAuthToken } from "@/lib/auth-session";

export default function FavoritesProvider({ children }: { children: ReactNode }) {
  const token = useAuthToken();
  useEffect(() => {
    if (!token) return;
    loadFavorites(token).catch((error: unknown) => {
      console.error("[marketplace] Failed to load favorites:", error);
      setFavoritesLoadError(token, error instanceof Error ? error.message : "Impossible de charger tes favoris.");
    });
  }, [token]);
  return children;
}
