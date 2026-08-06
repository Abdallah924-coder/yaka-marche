const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const REFERRAL_THRESHOLD = Number(process.env.REFERRAL_THRESHOLD || 5);

const router = express.Router();

// GET /api/referrals/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const referralCount = await User.countDocuments({ referredBy: user._id });

    res.json({
      code: user.referralCode,
      referralCount,
      freeBoostCredits: user.freeBoostCredits || 0,
      threshold: REFERRAL_THRESHOLD,
      progress: referralCount % REFERRAL_THRESHOLD
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;