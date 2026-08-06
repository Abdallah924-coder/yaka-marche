const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { welcomeEmail, loginAlertEmail, resetPasswordEmail, referralCreditEmail } = require('../utils/brevo');

const REFERRAL_THRESHOLD = Number(process.env.REFERRAL_THRESHOLD || 5);

function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // ex: "A1B2C3D4"
}

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function isAdminEmail(email) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  return !!adminEmail && email.toLowerCase() === adminEmail;
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    isAdmin: isAdminEmail(user.email),
    referralCode: user.referralCode,
    freeBoostCredits: user.freeBoostCredits || 0
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, city, password, ref } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Nom, email, telephone et mot de passe sont requis.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caracteres.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'Un compte existe deja avec cet email.' });
    }

    let referrer = null;
    if (ref) {
      referrer = await User.findOne({ referralCode: ref.trim().toUpperCase() });
    }

    // Genere un code de parrainage unique (retente en cas de collision rarissime)
    let referralCode;
    for (let i = 0; i < 5; i++) {
      const candidate = generateReferralCode();
      const taken = await User.findOne({ referralCode: candidate });
      if (!taken) { referralCode = candidate; break; }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      city: (city || '').trim(),
      passwordHash,
      referralCode,
      referredBy: referrer ? referrer._id : null
    });

    welcomeEmail(user).catch(() => {});

    if (referrer) {
      const totalReferrals = await User.countDocuments({ referredBy: referrer._id });
      if (totalReferrals > 0 && totalReferrals % REFERRAL_THRESHOLD === 0) {
        referrer.freeBoostCredits = (referrer.freeBoostCredits || 0) + 1;
        await referrer.save();
        referralCreditEmail(referrer, totalReferrals).catch(() => {});
      }
    }

    const token = signToken(user._id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    loginAlertEmail(user).catch(() => {});

    const token = signToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requis.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetTokenHash = tokenHash;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
      const resetLink = `${appUrl}/reinitialiser-mot-de-passe?token=${rawToken}`;
      resetPasswordEmail(user, resetLink).catch(() => {});
    }

    res.json({ ok: true, message: 'Si ce compte existe, un email de reinitialisation a ete envoye.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Lien invalide ou mot de passe manquant.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caracteres.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Ce lien de reinitialisation est invalide ou a expire.' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;