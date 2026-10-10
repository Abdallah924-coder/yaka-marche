"use client";

import { useEffect } from "react";

export default function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => caches.keys())
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("yaka-marche-")).map((key) => caches.delete(key)),
      ))
      .catch((error: unknown) => {
        console.error("[marketplace] Unable to clear the legacy offline cache:", error);
      });
  }, []);

  return null;
}
