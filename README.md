# Yaka Marché

Marketplace locale (acheteurs / vendeurs) pour le Congo — API Node.js + Express + MongoDB et storefront Next.js servis ensemble par le service Render existant.

Un produit **WORLDIFYAI** — by Devoué.

---

## 1. Structure du projet

```
yaka-marche/
├── frontend/                  # storefront Next.js
│   ├── src/app/                # accueil, catalogue, fiches produit, SEO
│   └── README.md               # configuration du service Render unique
├── backend/
│   ├── server.js              # serveur combiné Express API + Next.js
│   ├── package.json
│   ├── .env.example           # copier en .env et remplir
│   ├── models/
│   │   ├── User.js
│   │   └── Listing.js
│   ├── routes/
│   │   ├── auth.js            # inscription, connexion, profil
│   │   └── listings.js        # annonces : liste, détail, création, édition, suppression, boost
│   ├── middleware/
│   │   └── auth.js            # vérification du token JWT
│   └── utils/
│       └── brevo.js           # emails transactionnels via l'API HTTP Brevo
└── public/                    # ancienne interface conservée dans le dépôt
    ├── index.html              # accueil
    ├── inscription.html        # créer un compte
    ├── connexion.html          # se connecter
    ├── annonces.html           # parcourir / rechercher / filtrer
    ├── annonce.html             # détail d'une annonce + contact WhatsApp
    ├── publier.html             # publier une annonce (connexion requise)
    ├── tableau-de-bord.html     # gérer ses annonces, les mettre en avant, les supprimer
    ├── css/style.css
    └── js/api.js                # client API partagé par toutes les pages
```

## 2. Fonctionnalités

**Acheteurs**
- Parcourir les annonces, filtrer par catégorie, rechercher, trier par prix
- Filtrer par ville, avec Brazzaville et Pointe-Noire proposées en priorité
- Voir le détail d'une annonce sans créer de compte
- Contacter le vendeur directement sur WhatsApp (numéro + message pré-rempli)
- Catalogue Next.js responsive, favoris, alertes et profils vendeurs avec avis
- Passer commande et signaler un paiement manuel directement au vendeur

**Vendeurs**
- Créer un compte (nom, email, téléphone, ville, mot de passe)
- Publier une annonce (titre, catégorie, prix en FCFA, description, ville, WhatsApp)
- Tableau de bord : liste de ses annonces, statistiques (total / mises en avant)
- Modifier le statut, supprimer une annonce
- **Mettre en avant** une annonce pendant 14 jours par paiement manuel Mobile Money ou crypto avec capture de preuve et validation admin avant activation
- Publier, gérer et relancer gratuitement chaque annonce active une fois tous les 30 jours dans le nouveau storefront
- Partager son lien de parrainage et utiliser les crédits gagnés
- Voir les nouvelles commandes, vérifier le paiement reçu directement, puis suivre leur avancement

Pour les commandes, l’acheteur signale le paiement et le vendeur doit
confirmer lui-même sa réception. Yaka Marché ne collecte ni ne conserve
l’argent et ne vérifie pas automatiquement les transactions.

**Emails automatiques (Brevo)**
- Email de bienvenue à l'inscription
- Email de confirmation quand une annonce est mise en avant

## 3. Installation en local

Prérequis : Node.js 20.9+, un cluster MongoDB (Atlas gratuit suffit), un compte Brevo (gratuit).

```bash
cd backend
npm install
cp .env.example .env
# renseigner MONGODB_URI, JWT_SECRET, BREVO_API_KEY et les URL API dans .env
npm run build
npm start
```

Depuis `backend/`, `npm run build` installe les dépendances verrouillées du
frontend et construit Next.js. Le serveur démarre sur `http://localhost:5000` :
Express sert l'API (`/api/...`) et Next.js sert les pages du storefront.

## 4. Variables d'environnement (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | Chaîne de connexion MongoDB Atlas |
| `JWT_SECRET` | Chaîne secrète aléatoire pour signer les sessions |
| `BREVO_API_KEY` | Clé API Brevo (Settings → API Keys) |
| `BREVO_SENDER_EMAIL` | Adresse d'expédition validée dans Brevo |
| `BREVO_SENDER_NAME` | Nom affiché comme expéditeur |
| `PORT` | Port du serveur (5000 par défaut) |
| `CORS_ORIGIN` | Origine autorisée pour les clients API externes |
| `APP_URL` | URL publique du site, utilisée dans les emails et notifications |
| `MARKETPLACE_API_URL` | URL absolue de l'API pour les requêtes Next.js serveur, avec `/api` |
| `NEXT_PUBLIC_API_URL` | URL absolue de l'API pour le navigateur, avec `/api`, définie au build |

Sans `BREVO_API_KEY`, l'app fonctionne quand même : les emails sont simplement ignorés (log en console), rien ne bloque.

## 5. Mise en ligne

Le service Render existant sert maintenant les deux applications. Garder son
domaine et `MONGODB_URI` ; aucune nouvelle base, aucun second service Web et
aucune migration de données ne sont nécessaires.

Dans les réglages Render du service actuel :

- Root Directory : racine du dépôt (laisser le champ vide) afin que Render
  puisse accéder à la fois à `backend/` et `frontend/`
- Build Command : `npm ci --prefix backend && npm ci --include=dev --prefix frontend && npm run build --prefix frontend`
- Start Command : `npm start --prefix backend`
- Health Check Path : `/api/health`
- Node.js : version 20.9 ou plus récente

Définir `NODE_ENV=production`, `APP_URL`, `CORS_ORIGIN`,
`MARKETPLACE_API_URL` et `NEXT_PUBLIC_API_URL` avec l'origine
`https://yaka-marche.xyz` (ajouter `/api` aux deux URL API). Vérifier aussi les
variables existantes MongoDB, JWT, email, admin et paiement avant le
déploiement. `NEXT_PUBLIC_API_URL` doit être disponible lors du build. Voir
[frontend/README.md](frontend/README.md) pour les réglages détaillés, les tests
de mise en ligne et la procédure de retour arrière.

## 6. Prochaines étapes suggérées

- **Automatiser les paiements** de mise en avant : aujourd'hui le vendeur paie manuellement par Mobile Money ou crypto, puis un administrateur vérifie la preuve avant activation.
- **Panier multi-annonces, livraison et résolution des litiges** pour compléter les parcours marketplace.

---

Je veux que tu réalises une optimisation SEO complète et professionnelle de mon projet Yaka Marché.

Contexte du projet :
- Frontend : HTML, CSS, JavaScript (sans framework)
- Backend : Node.js + Express
- Hébergement : Render
- Domaine : https://yaka-marche.xyz

⚠️ Important :
- Ne casse aucune fonctionnalité existante.
- Conserve l'architecture actuelle.
- N'effectue aucun changement inutile.
- Explique chaque modification effectuée.

Je souhaite que tu implémentes les éléments suivants :

1. SEO TECHNIQUE
- Ajouter un <title> unique et optimisé sur chaque page.
- Ajouter une meta description pertinente sur chaque page.
- Ajouter la balise robots (index, follow).
- Ajouter des URL canoniques (canonical).
- Vérifier que chaque page possède un seul H1.
- Générer automatiquement les balises selon la page lorsque c'est nécessaire.

2. OPEN GRAPH ET TWITTER
Configurer complètement les balises :
- og:title
- og:description
- og:image
- og:url
- og:type
- twitter:card
- twitter:title
- twitter:description
- twitter:image

L'objectif est que les liens affichent un aperçu professionnel sur WhatsApp, Facebook, X (Twitter), LinkedIn et Telegram.

3. FAVICON
Configurer correctement le favicon.
Ajouter les tailles recommandées.
Vérifier qu'il apparaît sur tous les navigateurs.

4. ROBOTS.TXT
Créer un robots.txt optimisé.
Autoriser correctement les moteurs de recherche.
Déclarer le sitemap.

5. SITEMAP.XML
Créer un sitemap.xml automatiquement.
Inclure toutes les pages publiques.
Prévoir une génération automatique lors des mises à jour.

6. DONNÉES STRUCTURÉES (SCHEMA.ORG)
Ajouter des données JSON-LD adaptées :
- WebSite
- Organization
- WebPage
- BreadcrumbList lorsque pertinent
- Product ou LocalBusiness uniquement si cela apporte un avantage SEO.

7. PERFORMANCE
Optimiser :
- Compression Gzip/Brotli
- Cache HTTP
- Lazy Loading des images
- Préchargement des ressources importantes
- Minification si nécessaire
- Réduction du temps de chargement

8. ACCESSIBILITÉ
- Ajouter les attributs alt sur toutes les images.
- Vérifier les labels des formulaires.
- Corriger les problèmes d'accessibilité impactant le SEO.

9. EXPRESS
Configurer Express afin de :
- servir robots.txt
- servir sitemap.xml
- gérer correctement les fichiers statiques
- envoyer les bons headers HTTP
- gérer proprement les redirections

10. GOOGLE SEARCH CONSOLE
Préparer entièrement le projet afin que je puisse simplement :
- ajouter le domaine dans Google Search Console
- soumettre le sitemap
sans effectuer d'autres modifications.

11. MÉTADONNÉES
Optimiser toutes les métadonnées nécessaires pour Google, Bing, DuckDuckGo et les réseaux sociaux.

12. VÉRIFICATION FINALE
À la fin du travail :
- vérifier qu'il n'existe aucune erreur SEO ;
- vérifier que le site est prêt pour l'indexation Google ;
- fournir un rapport détaillé de toutes les modifications ;
- lister tous les fichiers créés ou modifiés ;
- expliquer pourquoi chaque modification améliore le référencement.

Je souhaite une implémentation propre, moderne, maintenable, conforme aux bonnes pratiques SEO de 2026 et prête pour la production.


C'est maintenant disponible : https://yaka-marche.xyz

*Yaka Marché — un produit WORLDIFYAI, by Devoué.*
