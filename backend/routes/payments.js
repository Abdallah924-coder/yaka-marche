const express = require('express');
const Listing = require('../models/Listing');
const User = require('../models/User');
const BoostRequest = require('../models/BoostRequest');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { boostPendingEmail, boostApprovedEmail } = require('../utils/brevo');

const router = express.Router();

// GET /api/payments/info
// Informations de paiement de l'administrateur (configurees dans .env),
// affichees sur la page de mise en avant avant l'upload de la preuve.
router.get('/info', requireAuth, (req, res) => {
  res.json({
    priceFcfa: Number(process.env.BOOST_PRICE_FCFA || 500),
    momo: {
      number: process.env.MOMO_NUMBER || '',
      name: process.env.MOMO_NAME || ''
    },
    crypto: {
      network: process.env.CRYPTO_NETWORK || '',
      address: process.env.CRYPTO_ADDRESS || '',
      amount: process.env.CRYPTO_AMOUNT || ''
    }
  });
});

// POST /api/payments/boost-request
// Le vendeur choisit un mode de paiement et envoie une capture d'ecran en preuve.
router.post('/boost-request', requireAuth, async (req, res) => {
  try {
    const { listingId, method, proofImage } = req.body;

    if (!listingId || !method || !proofImage) {
      return res.status(400).json({ error: 'Annonce, methode de paiement et capture d\'ecran sont requises.' });
    }
    if (!['momo', 'crypto'].includes(method)) {
      return res.status(400).json({ error: 'Methode de paiement invalide.' });
    }
    if (proofImage.length > 6_000_000) {
      return res.status(400).json({ error: 'Image trop lourde, choisis une capture plus legere.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (String(listing.owner) !== String(req.userId)) {
      return res.status(403).json({ error: 'Tu ne peux mettre en avant que tes propres annonces.' });
    }

    const existingPending = await BoostRequest.findOne({ listing: listingId, status: 'pending' });
    if (existingPending) {
      return res.status(409).json({ error: 'Une demande est deja en attente pour cette annonce.' });
    }

    const boostRequest = await BoostRequest.create({
      listing: listingId,
      user: req.userId,
      method,
      amountFcfa: Number(process.env.BOOST_PRICE_FCFA || 500),
      proofImage
    });

    const user = await User.findById(req.userId);
    if (user) boostPendingEmail(user, listing.title).catch(() => {});

    res.status(201).json({ boostRequest: { id: boostRequest._id, status: boostRequest.status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'envoi de la preuve de paiement.' });
  }
});

// GET /api/payments/boost-requests (admin) - demandes en attente
router.get('/boost-requests', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await BoostRequest.find({ status: 'pending' })
      .sort({ createdAt: 1 })
      .populate('listing', 'title price city')
      .populate('user', 'name email phone');

    res.json({
      boostRequests: requests.map(r => ({
        id: r._id,
        method: r.method,
        amountFcfa: r.amountFcfa,
        proofImage: r.proofImage,
        createdAt: r.createdAt,
        listing: r.listing ? { id: r.listing._id, title: r.listing.title, price: r.listing.price, city: r.listing.city } : null,
        user: r.user ? { name: r.user.name, email: r.user.email, phone: r.user.phone } : null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/payments/boost-requests/:id/approve (admin)
router.post('/boost-requests/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const boostRequest = await BoostRequest.findById(req.params.id);
    if (!boostRequest || boostRequest.status !== 'pending') {
      return res.status(404).json({ error: 'Demande introuvable ou deja traitee.' });
    }

    const listing = await Listing.findById(boostRequest.listing);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });

    listing.featured = true;
    await listing.save();

    boostRequest.status = 'approved';
    boostRequest.reviewedAt = new Date();
    await boostRequest.save();

    const user = await User.findById(boostRequest.user);
    if (user) boostApprovedEmail(user, listing.title).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/payments/boost-requests/:id/reject (admin)
router.post('/boost-requests/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const boostRequest = await BoostRequest.findById(req.params.id);
    if (!boostRequest || boostRequest.status !== 'pending') {
      return res.status(404).json({ error: 'Demande introuvable ou deja traitee.' });
    }

    boostRequest.status = 'rejected';
    boostRequest.reviewedAt = new Date();
    await boostRequest.save();

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;