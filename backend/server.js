require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/sellers');
const favoriteRoutes = require('./routes/favorites');
const alertRoutes = require('./routes/alerts');
const referralRoutes = require('./routes/referrals');
const sitemapRoutes = require('./routes/sitemap');

const Listing = require('./models/Listing');
const User = require('./models/User');
const { renderWithMeta } = require('./utils/seo');

const APP_URL = (process.env.APP_URL || 'https://yaka-marche.xyz').replace(/\/$/, '');
const DEFAULT_OG_IMAGE = `${APP_URL}/og-image.png`;

const app = express();

// Compression Gzip/Brotli (Brotli si le client l'accepte, sinon Gzip) sur toutes les reponses.
app.use(compression());

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
app.use(express.json({ limit: '15mb' }));

// --- API ---
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/referrals', referralRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'yaka-marche-backend' });
});

// --- SEO : sitemap.xml genere dynamiquement (toujours a jour) ---
app.use('/', sitemapRoutes);

const publicDir = path.join(__dirname, '..', 'public');

// --- Rendu cote serveur des balises meta pour les pages dynamiques ---
// WhatsApp, Facebook, Twitter/X, LinkedIn et Telegram recuperent l'aperçu
// d'un lien SANS executer le JavaScript de la page. Comme le contenu de
// /annonce et /annonceur est normalement charge en JS, on injecte ici les
// bonnes balises (titre, description, image, URL canonique) directement
// dans le HTML envoye, pour que le partage affiche un aperçu correct.
// Si l'annonce/le vendeur n'existe pas ou en cas d'erreur, on bascule sur
// le fichier statique normal (fallback silencieux, rien de casse).

app.get('/annonce', async (req, res, next) => {
  try {
    const id = req.query.id;
    const listing = id ? await Listing.findById(id).populate('owner', 'name') : null;

    if (!listing) return next();

    const description = listing.description.length > 155
      ? listing.description.slice(0, 152) + '...'
      : listing.description;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: listing.title,
      description,
      image: listing.images && listing.images[0] ? listing.images[0] : DEFAULT_OG_IMAGE,
      offers: {
        '@type': 'Offer',
        price: listing.price,
        priceCurrency: 'XAF',
        availability: listing.status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${APP_URL}/annonce?id=${listing._id}`,
        areaServed: listing.city
      },
      ...(listing.owner ? { seller: { '@type': 'Person', name: listing.owner.name } } : {})
    };

    const html = renderWithMeta('annonce.html', {
      title: `${listing.title} — Yaka Marché`,
      description,
      url: `${APP_URL}/annonce?id=${listing._id}`,
      image: listing.images && listing.images[0] ? listing.images[0] : DEFAULT_OG_IMAGE,
      robots: listing.status === 'active' ? 'index, follow' : 'noindex, follow',
      jsonLd
    });

    res.set('Cache-Control', 'no-cache');
    res.send(html);
  } catch (err) {
    next();
  }
});

app.get('/annonceur', async (req, res, next) => {
  try {
    const id = req.query.id;
    const seller = id ? await User.findById(id) : null;

    if (!seller) return next();

    const description = `${seller.name} sur Yaka Marché${seller.city ? ' — ' + seller.city : ''}. ` +
      `Note moyenne ${seller.ratingAvg > 0 ? seller.ratingAvg.toFixed(1) + '/5' : 'pas encore notee'}.`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: seller.name,
        ...(seller.ratingCount > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: seller.ratingAvg,
            reviewCount: seller.ratingCount
          }
        } : {})
      }
    };

    const html = renderWithMeta('annonceur.html', {
      title: `${seller.name} — Profil vendeur — Yaka Marché`,
      description,
      url: `${APP_URL}/annonceur?id=${seller._id}`,
      image: DEFAULT_OG_IMAGE,
      robots: 'index, follow',
      jsonLd
    });

    res.set('Cache-Control', 'no-cache');
    res.send(html);
  } catch (err) {
    next();
  }
});

// --- Frontend statique (dossier /public a la racine du projet) ---
// "extensions: ['html']" permet des URLs propres : /connexion sert connexion.html
// Cache HTTP : long pour les images/icones, plus court pour CSS/JS (encore en
// developpement actif), et aucun cache pour les pages HTML (contenu qui doit
// toujours etre a jour).
app.use(express.static(publicDir, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 jour
    } else if (/\.(png|jpg|jpeg|svg|ico|webp)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 jours
    }
  }
}));

// Toute route non-API renvoie index.html (pages HTML classiques, pas de SPA framework)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI manquant. Copie .env.example en .env et renseigne-le.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connecte a MongoDB');
    app.listen(PORT, () => console.log(`Yaka Marche backend sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('Echec de connexion a MongoDB :', err.message);
    process.exit(1);
  });