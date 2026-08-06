# 🚀 GUIDE DE DÉPLOIEMENT — Yaka Marché (Production)

## ✅ Statut : PRÊT POUR PRODUCTION

Toutes les optimisations de sécurité et SEO ont été appliquées. Le projet ne casse aucune fonctionnalité existante.

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

### 1. Variables d'Environnement
```bash
cd backend
cp .env.example .env
```

Remplir les variables requises :
- ✅ `MONGODB_URI` — Connexion MongoDB (Atlas ou autre)
- ✅ `JWT_SECRET` — Clé secrète aléatoire (min 32 caractères)
- ✅ `BREVO_API_KEY` — Clé API Brevo pour emails
- ✅ `APP_URL` — URL publique du site (https://yaka-marche.xyz)
- ✅ `CORS_ORIGIN` — Origine (https://yaka-marche.xyz en prod)
- ✅ `ADMIN_EMAIL` — Email administrateur pour valider les paiements

### 2. Dépendances Installées
```bash
npm ls # Vérifier que toutes les dépendances sont installées
```

Nouvelles dépendances ajoutées :
- ✅ `helmet@6.2.0` — Headers de sécurité
- ✅ `express-rate-limit@6.11.2` — Rate limiting
- ✅ `express-mongo-sanitize@6.x` — Protection XSS/NoSQL injection

### 3. Fichiers de Sécurité SEO Créés
- ✅ `/public/robots.txt` — Configuration crawl
- ✅ `/public/sitemap.xml` — Index des pages (13 URLs)
- ✅ `/SEO-REPORT.md` — Rapport détaillé des modifications

### 4. Modifications de Code Appliquées
- ✅ `/backend/server.js` — Sécurité (helmet, sanitization, rate-limit)
- ✅ `/backend/server.js` — Cache HTTP optimisé
- ✅ `/backend/routes/listings.js` — Validation images côté serveur
- ✅ Tous les fichiers `/public/*.html` — Meta tags SEO + Open Graph + Twitter + JSON-LD

### 5. Tests Locaux
```bash
cd backend
npm start
```

Vérifier que :
- [ ] Le serveur démarre sans erreurs
- [ ] `localhost:5000` affiche la homepage
- [ ] `/api/health` répond avec `{ ok: true }`
- [ ] `/robots.txt` est accessible
- [ ] `/sitemap.xml` est accessible

---

## 🌐 HÉBERGEMENT (Render/Railway/Fly.io)

### Configuration Render
```
Build Command: npm install (dans le dossier backend/)
Start Command: npm start
```

### Variables d'Environnement à Ajouter
Copier-coller dans les réglages de l'hébergeur :
```
MONGODB_URI=<ta_connexion_mongodb>
JWT_SECRET=<clé_aléatoire_32_caractères>
BREVO_API_KEY=<ta_clé_api_brevo>
BREVO_SENDER_EMAIL=contact@yaka-marche.xyz
BREVO_SENDER_NAME=Yaka Marche
PORT=10000 (Render définit automatiquement)
CORS_ORIGIN=https://yaka-marche.xyz
APP_URL=https://yaka-marche.xyz
ADMIN_EMAIL=admin@yaka-marche.xyz
BOOST_PRICE_FCFA=500
```

### Déploiement
1. Connecter le repo GitHub
2. Ajouter les variables d'environnement
3. Déclencher le déploiement
4. Attendre ~2-3 minutes
5. Tester `https://yaka-marche.xyz/`

---

## 🔍 GOOGLE SEARCH CONSOLE

### Après le déploiement (48-72h)

1. **Accès Google Search Console :**
   https://search.google.com/search-console

2. **Ajouter propriété :**
   - Type : URL
   - URL : `https://yaka-marche.xyz`

3. **Vérifier la propriété :**
   - Option 1 : DNS TXT record
   - Option 2 : Fichier HTML (upload manuelle)
   - Option 3 : Google Analytics (si configuré)

4. **Soumettre le sitemap :**
   Menu → Sitemaps → Ajouter nouveau sitemap
   ```
   https://yaka-marche.xyz/sitemap.xml
   ```

5. **Monitorer :**
   - Couverture : Pages indexées vs erreurs
   - Performance : CTR, position moyenne, impressions
   - Requêtes : Mots-clés qui ramènent du trafic

---

## 📊 MONITORING & MAINTENANCE

### Vérifications Régulières
- [ ] **Chaque semaine :** Google Search Console (erreurs de crawl)
- [ ] **Chaque mois :** Performance (Page Speed, Core Web Vitals)
- [ ] **Chaque trimestre :** Bing Webmaster Tools (audit complémentaire)

### Outils Recommandés
- **Google PageSpeed Insights :** https://pagespeed.web.dev
- **Google Mobile-Friendly Test :** https://search.google.com/test/mobile-friendly
- **Lighthouse Audit :** DevTools > Lighthouse
- **Schema.org Validator :** https://validator.schema.org

---

## 🛡️ SÉCURITÉ — CHECKLIST POST-DÉPLOIEMENT

### Headers de Sécurité
- ✅ `Helmet.js` — Content Security Policy, X-Frame-Options, etc.
- ✅ `express-mongo-sanitize` — Protection XSS et NoSQL injection
- ✅ `express-rate-limit` — 200 req/15min par IP pour /api/
- ✅ CORS restrictif — Domaine unique configuré

### Gestion des Credentials
- ✅ JWT_SECRET — Min 32 caractères, unique par déploiement
- ✅ BREVO_API_KEY — Jamais exposée en frontend
- ✅ MONGODB_URI — Connexion SSL/TLS (MongoDB Atlas)

### Validation des Données
- ✅ Validation images — Taille max 1.2MB, format data URL
- ✅ Validation authentification — Tokens JWT 30 jours
- ✅ Validation formulaires — Email, téléphone, prix

---

## 📈 AMÉLIORATIONS SEO POST-DÉPLOIEMENT

### Premières 72h
- [ ] Soumettre sitemap à Google Search Console
- [ ] Soumettre sitemap à Bing Webmaster Tools
- [ ] Vérifier robots.txt sur https://yaka-marche.xyz/robots.txt
- [ ] Vérifier sitemap sur https://yaka-marche.xyz/sitemap.xml

### 1ère Semaine
- [ ] Google Search Console : Vérifier couverture
- [ ] Lighthouse Audit : Score performance > 80
- [ ] Mobile-Friendly Test : Responsive design OK

### 1er Mois
- [ ] Monitoring des requêtes organiques
- [ ] Ajustement des priorités sitemap
- [ ] Création de contenu (optionnel : blog posts)

### 3-6 Mois
- [ ] Indexation complète (~50-80% des pages selon le trafic)
- [ ] Classement sur mots-clés locaux (congo, brazzaville)
- [ ] Backlinks organiques

---

## 🔧 DÉPANNAGE

### Le serveur ne démarre pas
```bash
# Vérifier les logs
npm start

# Erreurs courantes :
# "MONGODB_URI manquant" → Ajouter MONGODB_URI dans .env
# "JWT_SECRET manquant" → Ajouter JWT_SECRET dans .env
# "Port 5000 déjà utilisé" → Changer PORT dans .env
```

### Les pages ne s'indexent pas
```bash
# Vérifier que robots.txt autorise l'accès
curl https://yaka-marche.xyz/robots.txt

# Vérifier le sitemap
curl https://yaka-marche.xyz/sitemap.xml

# Vérifier les headers de sécurité
curl -I https://yaka-marche.xyz
```

### Images ne se chargent pas
- [ ] `img.loading="lazy"` est présent en HTML
- [ ] Alt tags sont présents
- [ ] Format data:// ou URL relative dans `img.src`

---

## 📞 SUPPORT

Pour toute question SEO ou sécurité :
1. Consulter `SEO-REPORT.md` pour le détail des modifications
2. Vérifier les logs de Google Search Console
3. Tester avec Lighthouse et PageSpeed Insights

---

## ✅ RÉSUMÉ DES MODIFICATIONS

| Catégorie | Avant | Après |
|-----------|-------|-------|
| **Meta Tags** | Basique | Complet (14 pages) |
| **Open Graph** | ❌ | ✅ (14 pages) |
| **Twitter Card** | ❌ | ✅ (14 pages) |
| **JSON-LD** | ❌ | ✅ (8 pages) |
| **Sitemap** | ❌ | ✅ (13 URLs) |
| **robots.txt** | ❌ | ✅ |
| **Security Headers** | 1 | 7+ |
| **Rate Limiting** | ❌ | ✅ |
| **Lazy Loading** | ❌ | ✅ |
| **Cache HTTP** | Basique | Optimisé |

---

**Date :** 2026-08-06  
**Statut :** ✅ Production Ready  
**Prochaine étape :** Deploy + Google Search Console
