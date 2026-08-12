const rateLimit = require('express-rate-limit');

// Endpoints sensibles (connexion, inscription, mot de passe) : limite stricte
// pour empecher le brute-force et le credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Reessaie dans quelques minutes.' }
});

// Ensemble de l'API : filet de securite general contre l'abus/spam,
// large pour ne jamais gener un usage normal.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes, reessaie un peu plus tard.' }
});

module.exports = { authLimiter, generalLimiter };