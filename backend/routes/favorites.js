const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/favorites/ids
// Liste legere des IDs favoris, pour marquer les coeurs sans recharger toutes les annonces.
router.get('/ids', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('favorites');
    res.json({ ids: (user.favorites || []).map(String) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/favorites
// Details complets des annonces favorites, pour la page "Favoris".
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'favorites',
      populate: { path: 'owner', select: 'name phone ratingAvg ratingCount' }
    });

    const listings = (user.favorites || [])
      .filter(Boolean)
      .map((l) => ({
        id: l._id,
        title: l.title,
        category: l.category,
        price: l.price,
        city: l.city,
        images: l.images && l.images[0] ? [l.images[0]] : [],
        featured: l.featured,
        status: l.status,
        views: l.views || 0,
        createdAt: l.createdAt,
        owner: l.owner ? {
          id: l.owner._id,
          name: l.owner.name,
          ratingAvg: l.owner.ratingAvg,
          ratingCount: l.owner.ratingCount
        } : undefined
      }));

    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;