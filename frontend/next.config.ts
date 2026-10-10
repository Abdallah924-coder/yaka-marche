import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/annonces.html", destination: "/annonces", permanent: true },
      { source: "/publier.html", destination: "/publier", permanent: true },
      { source: "/connexion.html", destination: "/connexion", permanent: true },
      { source: "/inscription.html", destination: "/inscription", permanent: true },
      { source: "/favoris.html", destination: "/favoris", permanent: true },
      { source: "/alertes.html", destination: "/alertes", permanent: true },
      { source: "/admin.html", destination: "/admin", permanent: true },
      { source: "/tableau-de-bord.html", destination: "/compte", permanent: true },
      { source: "/tableau-de-bord", destination: "/compte", permanent: true },
      { source: "/mise-en-avant.html", destination: "/mise-en-avant", permanent: true },
      { source: "/mot-de-passe-oublie.html", destination: "/mot-de-passe-oublie", permanent: true },
      { source: "/reinitialiser-mot-de-passe.html", destination: "/reinitialiser-mot-de-passe", permanent: true },
      { source: "/mentions-legales.html", destination: "/mentions-legales", permanent: true },
      { source: "/politique-de-confidentialite.html", destination: "/politique-de-confidentialite", permanent: true },
      {
        source: "/annonce.html",
        has: [{ type: "query", key: "id", value: "(?<id>.+)" }],
        destination: "/produit/:id?",
        permanent: true,
      },
      {
        source: "/annonce",
        has: [{ type: "query", key: "id", value: "(?<id>.+)" }],
        destination: "/produit/:id?",
        permanent: true,
      },
      {
        source: "/annonceur.html",
        has: [{ type: "query", key: "id", value: "(?<id>.+)" }],
        destination: "/vendeur/:id?",
        permanent: true,
      },
      {
        source: "/annonceur",
        has: [{ type: "query", key: "id", value: "(?<id>.+)" }],
        destination: "/vendeur/:id?",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
