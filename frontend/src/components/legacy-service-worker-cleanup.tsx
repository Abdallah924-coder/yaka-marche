export default function LegacyServiceWorkerCleanup() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(async () => {
        try {
          if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
          }
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(
              keys.filter((key) => key.startsWith("yaka-marche-")).map((key) => caches.delete(key)),
            );
          }
        } catch (error) {
          console.error("[marketplace] Unable to clear the legacy offline cache:", error);
        }
      })();`,
      }}
    />
  );
}
