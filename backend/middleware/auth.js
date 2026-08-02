const jwt = require('jsonwebtoken');
const User = require('../models/User');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Connexion requise.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide, reconnecte-toi.' });
  }
}

// A utiliser APRES requireAuth. Compare l'email de l'utilisateur connecte
// a la variable ADMIN_EMAIL du .env pour autoriser l'acces aux routes admin.
async function requireAdmin(req, res, next) {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    if (!adminEmail) {
      return res.status(403).json({ error: 'Aucun administrateur configure (ADMIN_EMAIL manquant).' });
    }

    const user = await User.findById(req.userId);
    if (!user || user.email.toLowerCase() !== adminEmail) {
      return res.status(403).json({ error: 'Acces reserve a l\'administrateur.' });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = { requireAuth, requireAdmin };