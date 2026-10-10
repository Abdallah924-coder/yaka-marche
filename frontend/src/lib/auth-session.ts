"use client";

import { useSyncExternalStore } from "react";

const AUTH_CHANGE_EVENT = "yaka-auth-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

function getTokenSnapshot() {
  return localStorage.getItem("yaka_token") || "";
}

function getUserSnapshot() {
  return localStorage.getItem("yaka_user") || "";
}

export function useAuthToken() {
  return useSyncExternalStore(subscribe, getTokenSnapshot, () => "");
}

export function useAuthUser() {
  const rawUser = useSyncExternalStore(subscribe, getUserSnapshot, () => "");
  try {
    return rawUser
      ? JSON.parse(rawUser) as { id?: string; name?: string; phone?: string; city?: string; isAdmin?: boolean }
      : null;
  } catch {
    return null;
  }
}

export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}
