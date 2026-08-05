const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function recomputeRating(sellerId) {
  const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
  const stats = await Review.aggregate([
    { $match: { seller: sellerObjectId } },
    { $group: { _id: '$seller', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const avg = stats.length ? Math.round(stats[0].avg * 10) / 10 : 0;
  const count = stats.length ? stats[0].count : 0;

  await User.findByIdAndUpdate(sellerId, { ratingAvg: avg, ratingCount: count });
  return { avg, count };
}

// GET /api/sellers/:id
// Profil public d'un vendeur : infos, note moyenne, ses annonces actives, ses avis.
router.get('/:id', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ error: 'Vendeur introuvable.' });

    const [listings, reviews] = await Promise.all([
      Listing.find({ owner: seller._id, status: 'active' }).sort({ featured: -1, createdAt: -1 }),
      Review.find({ seller: seller._id }).sort({ createdAt: -1 }).populate('reviewer', 'name')
    ]);

    res.json({
      seller: {
        id: seller._id,
        name: seller.name,
        city: seller.city,
        memberSince: seller.createdAt,
        ratingAvg: seller.ratingAvg,
        ratingCount: seller.ratingCount
      },
      listings: listings.map((l) => ({
        id: l._id,
        title: l.title,
        category: l.category,
        price: l.price,
        city: l.city,
        featured: l.featured,
        images: l.images && l.images[0] ? [l.images[0]] : [],
        createdAt: l.createdAt
      })),
      reviews: reviews.map((r) => ({
        id: r._id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: r.reviewer ? r.reviewer.name : 'Utilisateur'
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: 'Vendeur introuvable.' });
  }
});

// POST /api/sellers/:id/reviews
// Laisse ou met a jour un avis (une seule fois par personne et par vendeur).
router.post('/:id/reviews', requireAuth, async (req, res) => {
  try {
    const sellerId = req.params.id;
    const { rating, comment } = req.body;

    if (String(sellerId) === String(req.userId)) {
      return res.status(400).json({ error: 'Tu ne peux pas te noter toi-meme.' });
    }
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'La note doit etre comprise entre 1 et 5.' });
    }

    const seller = await User.findById(sellerId);
    if (!seller) return res.status(404).json({ error: 'Vendeur introuvable.' });

    await Review.findOneAndUpdate(
      { seller: sellerId, reviewer: req.userId },
      { rating: ratingNum, comment: (comment || '').trim(), createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const stats = await recomputeRating(sellerId);

    res.status(201).json({ ok: true, ratingAvg: stats.avg, ratingCount: stats.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'envoi de l\'avis.' });
  }
});

module.exports = router;