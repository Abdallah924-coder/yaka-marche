const express = require('express');
const SearchAlert = require('../models/SearchAlert');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/alerts (mes alertes)
router.get('/', async (req, res) => {
  try {
    const alerts = await SearchAlert.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({
      alerts: alerts.map((a) => ({
        id: a._id,
        category: a.category,
        city: a.city,
        keyword: a.keyword,
        createdAt: a.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/alerts
router.post('/', async (req, res) => {
  try {
    const { category, city, keyword } = req.body;

    const existingCount = await SearchAlert.countDocuments({ user: req.userId });
    if (existingCount >= 10) {
      return res.status(400).json({ error: 'Maximum 10 alertes actives. Supprime-en une avant d\'en creer une nouvelle.' });
    }

    const alert = await SearchAlert.create({
      user: req.userId,
      category: category || 'Toutes',
      city: (city || '').trim(),
      keyword: (keyword || '').trim()
    });

    res.status(201).json({
      alert: { id: alert._id, category: alert.category, city: alert.city, keyword: alert.keyword, createdAt: alert.createdAt }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la creation de l\'alerte.' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    const alert = await SearchAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alerte introuvable.' });
    if (String(alert.user) !== String(req.userId)) {
      return res.status(403).json({ error: 'Tu ne peux supprimer que tes propres alertes.' });
    }
    await alert.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;