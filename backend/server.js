require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/sellers');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
// Limite relevee pour accepter les captures d'ecran de paiement en base64
app.use(express.json({ limit: '15mb' }));

// --- API ---
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'yaka-marche-backend' });
});

// --- Frontend statique (dossier /public a la racine du projet) ---
// "extensions: ['html']" permet des URLs propres : /connexion sert connexion.html
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));

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