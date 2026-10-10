require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/sellers');
const favoriteRoutes = require('./routes/favorites');
const alertRoutes = require('./routes/alerts');
const referralRoutes = require('./routes/referrals');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const sitemapRoutes = require('./routes/sitemap');
const { generalLimiter } = require('./middleware/rateLimit');
const { initializeFeaturedListings, expireFeaturedListings } = require('./utils/featured-listings');
const { ensureAdminAccount } = require('./utils/admin-account');

const frontendDir = path.join(__dirname, '..', 'frontend');
const next = require('module').createRequire(path.join(frontendDir, 'package.json'))('next');

const app = express();

app.set('trust proxy', 1);
// Headers de securite standards (X-Content-Type-Options, X-Frame-Options,
// Strict-Transport-Security, etc.). CSP desactivee : le site charge des
// images en base64 (data:) et des scripts tiers (Google Analytics, fonts)
// qu'une CSP par defaut bloquerait ; a affiner plus tard si besoin.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Compression Gzip/Brotli (Brotli si le client l'accepte, sinon Gzip) sur toutes les reponses.
app.use(compression());

// Filet de securite general contre l'abus/spam sur toute l'API.
app.use('/api', generalLimiter);

// Redirection canonique : force le domaine sans "www" et le HTTPS, pour eviter
// que Google ne voie 2 versions differentes du meme site (mauvais pour le SEO).
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'] || req.protocol;

  if (host.startsWith('www.')) {
    return res.redirect(301, `https://${host.slice(4)}${req.originalUrl}`);
  }
  if (proto !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  next();
});

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
// Limite relevee pour accepter plusieurs images d'annonce + captures d'ecran en base64
app.use('/api', express.json({ limit: '15mb' }));

// --- API ---
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'yaka-marche-backend' });
});

app.get(['/sw.js', '/service-worker.js'], (req, res) => {
  res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.set('Service-Worker-Allowed', '/');
  res.status(410).type('text/plain').send('Legacy service worker retired.');
});

app.use('/', sitemapRoutes);

const legacyPageRedirects = {
  '/index.html': '/',
  '/annonces.html': '/annonces',
  '/publier.html': '/publier',
  '/connexion.html': '/connexion',
  '/inscription.html': '/inscription',
  '/favoris.html': '/favoris',
  '/alertes.html': '/alertes',
  '/admin.html': '/admin',
  '/tableau-de-bord.html': '/compte',
  '/tableau-de-bord': '/compte',
  '/mise-en-avant.html': '/mise-en-avant',
  '/mot-de-passe-oublie.html': '/mot-de-passe-oublie',
  '/reinitialiser-mot-de-passe.html': '/reinitialiser-mot-de-passe',
  '/mentions-legales.html': '/mentions-legales',
  '/politique-de-confidentialite.html': '/politique-de-confidentialite'
};

app.get(Object.keys(legacyPageRedirects), (req, res) => {
  res.redirect(301, legacyPageRedirects[req.path]);
});

app.get(['/annonce', '/annonce.html'], (req, res) => {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  res.redirect(301, id ? `/produit/${encodeURIComponent(id)}` : '/annonces');
});

app.get(['/annonceur', '/annonceur.html'], (req, res) => {
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  res.redirect(301, id ? `/vendeur/${encodeURIComponent(id)}` : '/annonces');
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI manquant. Copie .env.example en .env et renseigne-le.');
  process.exit(1);
}

const nextApp = next({
  dev: process.env.NODE_ENV !== 'production',
  dir: frontendDir
});
const nextHandler = nextApp.getRequestHandler();

app.all('*', (req, res, nextMiddleware) => {
  if (req.path.startsWith('/api/')) return nextMiddleware();
  nextHandler(req, res).catch(nextMiddleware);
});

app.use((err, req, res, nextMiddleware) => {
  console.error('[frontend] Next.js request failed:', err);
  if (res.headersSent) return nextMiddleware(err);
  res.status(500).send('Une erreur est survenue lors du chargement de la page.');
});

async function start() {
  try {
    await Promise.all([mongoose.connect(MONGODB_URI), nextApp.prepare()]);
    await ensureAdminAccount();
    await initializeFeaturedListings();
    const expirationTimer = setInterval(() => {
      expireFeaturedListings().catch((err) => {
        console.error('[marketplace] Echec de l’expiration des mises en avant :', err);
      });
    }, 60 * 1000);
    expirationTimer.unref();
    console.log('Connecte a MongoDB');
    app.listen(PORT, () => console.log(`Yaka Marche (Next.js + Express) sur le port ${PORT}`));
  } catch (err) {
    console.error('Echec du demarrage de Yaka Marche :', err.message);
    process.exit(1);
  }
}

start();