# Yaka Marché

Marketplace locale (acheteurs / vendeurs) pour le Congo — Node.js + Express + MongoDB côté serveur, pages HTML/CSS/JS classiques côté client, servies par le même serveur.

Un produit **WORLDIFYAI** — by Devoué.

---

## 1. Structure du projet

```
yaka-marche/
├── backend/
│   ├── server.js              # point d'entrée Express (API + sert le frontend)
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
└── public/                    # frontend statique, servi par le backend
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
- Voir le détail d'une annonce sans créer de compte
- Contacter le vendeur directement sur WhatsApp (numéro + message pré-rempli)

**Vendeurs**
- Créer un compte (nom, email, téléphone, ville, mot de passe)
- Publier une annonce (titre, catégorie, prix en FCFA, description, ville, WhatsApp)
- Tableau de bord : liste de ses annonces, statistiques (total / mises en avant)
- Modifier le statut, supprimer une annonce
- **Mettre en avant** une annonce (500 FCFA) pour apparaître en tête des résultats — emplacement prévu dans le code pour brancher un vrai paiement Mobile Money avant de confirmer

**Emails automatiques (Brevo)**
- Email de bienvenue à l'inscription
- Email de confirmation quand une annonce est mise en avant

## 3. Installation en local

Prérequis : Node.js 18+, un cluster MongoDB (Atlas gratuit suffit), un compte Brevo (gratuit).

```bash
cd backend
npm install
cp .env.example .env
# renseigner MONGODB_URI, JWT_SECRET, BREVO_API_KEY dans .env
npm start
```

Le serveur démarre sur `http://localhost:5000` et sert à la fois l'API (`/api/...`) et les pages du site (`/`, `/annonces.html`, etc.).

## 4. Variables d'environnement (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | Chaîne de connexion MongoDB Atlas |
| `JWT_SECRET` | Chaîne secrète aléatoire pour signer les sessions |
| `BREVO_API_KEY` | Clé API Brevo (Settings → API Keys) |
| `BREVO_SENDER_EMAIL` | Adresse d'expédition validée dans Brevo |
| `BREVO_SENDER_NAME` | Nom affiché comme expéditeur |
| `PORT` | Port du serveur (5000 par défaut) |
| `CORS_ORIGIN` | Origine autorisée si le frontend est un jour séparé du backend |

Sans `BREVO_API_KEY`, l'app fonctionne quand même : les emails sont simplement ignorés (log en console), rien ne bloque.

## 5. Mise en ligne

Le plus simple : un seul service Node (le backend sert aussi les pages HTML).

1. **Base de données** : créer un cluster gratuit sur MongoDB Atlas, récupérer l'URI de connexion.
2. **Hébergement du serveur** : Render, Railway ou Fly.io (offres gratuites/pas chères disponibles).
   - Build command : `npm install` (dans `backend/`)
   - Start command : `npm start`
   - Ajouter les variables d'environnement du `.env` dans les réglages de l'hébergeur
3. **Nom de domaine** : pointer un domaine (ex. via WORLDIFYAI) vers l'hébergeur choisi.

## 6. Prochaines étapes suggérées

- **Paiement Mobile Money réel** sur la mise en avant : brancher un agrégateur (MaxiCash, Semoa, ou API directe Airtel Money / MTN MoMo) sur la route `POST /api/listings/:id/boost` avant de confirmer `featured = true`.
- **Upload de photos** pour les annonces (aujourd'hui : texte + prix + description uniquement).
- **Modération** : validation manuelle ou automatique des annonces avant publication.
- **Notation vendeurs** pour construire la confiance entre utilisateurs.

---

*Yaka Marché — un produit WORLDIFYAI, by Devoué.*
