const express = require('express');
const User = require('../models/User');
const Listing = require('../models/Listing');
const BoostRequest = require('../models/BoostRequest');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalListings, totalFeatured, totalPendingBoosts, totalApprovedBoosts] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.countDocuments({ featured: true }),
      BoostRequest.countDocuments({ status: 'pending' }),
      BoostRequest.countDocuments({ status: 'approved' })
    ]);

    res.json({ totalUsers, totalListings, totalFeatured, totalPendingBoosts, totalApprovedBoosts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/admin/users
// Liste des utilisateurs avec email, date d'inscription et nombre d'annonces.
router.get('/users', async (req, res) => {
  try {
    const [users, counts] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Listing.aggregate([{ $group: { _id: '$owner', count: { $sum: 1 } } }])
    ]);

    const countMap = {};
    counts.forEach((c) => { countMap[String(c._id)] = c.count; });

    res.json({
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        city: u.city,
        createdAt: u.createdAt,
        listingsCount: countMap[String(u._id)] || 0
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;