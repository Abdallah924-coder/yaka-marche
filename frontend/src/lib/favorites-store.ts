"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { browserApiBaseUrl } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";

type FavoritesSnapshot = {
  token: string;
  ids: Set<string>;
  loaded: boolean;
  error: string;
};

const EMPTY_IDS = new Set<string>();
const SERVER_SNAPSHOT: FavoritesSnapshot = { token: "", ids: EMPTY_IDS, loaded: false, error: "" };
let snapshot: FavoritesSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): FavoritesSnapshot {
  return SERVER_SNAPSHOT;
}

function updateSnapshot(next: FavoritesSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export async function loadFavorites(token: string) {
  if (!token) return;
  if (snapshot.token !== token) {
    updateSnapshot({ token, ids: EMPTY_IDS, loaded: false, error: "" });
  }
  const response = await fetch(`${browserApiBaseUrl}/favorites/ids`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Impossible de charger tes favoris.");
  if (snapshot.token === token) {
    updateSnapshot({
      token, ids: new Set(Array.isArray(data.ids) ? data.ids.map(String) : []),
      loaded: true, error: "",
    });
  }
}

export function useFavorites() {
  const token = useAuthToken();
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = current.token === token ? current.ids : EMPTY_IDS;
  const loaded = !token || (current.token === token && current.loaded);

  const toggleFavorite = useCallback(async (listingId: string) => {
    if (!token) throw new Error("Connecte-toi pour gérer tes favoris.");
    const response = await fetch(`${browserApiBaseUrl}/listings/${encodeURIComponent(listingId)}/favorite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de modifier tes favoris.");
    if (snapshot.token === token) {
      const nextIds = new Set(snapshot.ids);
      if (data.favorited) nextIds.add(listingId);
      else nextIds.delete(listingId);
      updateSnapshot({ token, ids: nextIds, loaded: true, error: "" });
    }
    return Boolean(data.favorited);
  }, [token]);

  const error = current.token === token ? current.error : "";
  return useMemo(() => ({ ids, loaded, error, toggleFavorite }), [ids, loaded, error, toggleFavorite]);
}

export function setFavoritesLoadError(token: string, error: string) {
  if (snapshot.token === token) {
    updateSnapshot({ ...snapshot, loaded: true, error });
  }
}
