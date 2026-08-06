require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/sellers');
const favoriteRoutes = require('./routes/favorites');
const alertRoutes = require('./routes/alerts');
const referralRoutes = require('./routes/referrals');

const app = express();

// Security headers
app.use(helmet());

// Basic rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5000';
if (corsOrigin === '*') {
  console.warn('Warning: CORS_ORIGIN is set to "*" — consider restricting this in production.');
}
app.use(cors({ origin: corsOrigin }));

// Limit JSON body size (protect against very large base64 images)
app.use(express.json({ limit: '8mb' }));

// Data sanitization against NoSQL injection and XSS
app.use(mongoSanitize());

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

const publicDir = path.join(__dirname, '..', 'public');

// Serve robots.txt and sitemap.xml
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').sendFile(path.join(publicDir, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').sendFile(path.join(publicDir, 'sitemap.xml'));
});

// Cache headers for static assets
app.use(express.static(publicDir, {
  extensions: ['html'],
  setHeaders: (res, filepath) => {
    // Cache long-lived assets (images, fonts, icons, js, css)
    if (/\.(jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot|js|css)$/.test(filepath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    }
    // No-cache for HTML pages (check for updates)
    else if (/\.html$/.test(filepath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate'); // 1 hour
    }
    // Security headers for all responses
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'), (err) => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI) {
  console.error('MONGODB_URI manquant. Copie .env.example en .env et renseigne-le.');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET manquant. Definis JWT_SECRET dans le fichier .env pour signer les tokens JWT.');
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