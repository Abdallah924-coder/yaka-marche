const express = require('express');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { listingPublishedEmail } = require('../utils/brevo');

const router = express.Router();

function publicListing(listing) {
  const owner = listing.owner && listing.owner.name ? {
    name: listing.owner.name,
    phone: listing.owner.phone
  } : undefined;

  return {
    id: listing._id,
    title: listing.title,
    category: listing.category,
    price: listing.price,
    description: listing.description,
    city: listing.city,
    phone: listing.phone,
    featured: listing.featured,
    status: listing.status,
    createdAt: listing.createdAt,
    ownerId: listing.owner && listing.owner._id ? listing.owner._id : listing.owner,
    owner
  };
}

// GET /api/listings?category=&search=&sort=recent|price_asc|price_desc
// Par defaut, les annonces "featured" (mise en avant validee) apparaissent en premier.
router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const filter = { status: 'active' };

    if (category && category !== 'Toutes') {
      filter.category = category;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    let query = Listing.find(filter).populate('owner', 'name phone');

    if (sort === 'price_asc') query = query.sort({ featured: -1, price: 1 });
    else if (sort === 'price_desc') query = query.sort({ featured: -1, price: -1 });
    else query = query.sort({ featured: -1, createdAt: -1 });

    const listings = await query.limit(200);
    res.json({ listings: listings.map(publicListing) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors du chargement des annonces.' });
  }
});

// GET /api/listings/mine (annonces de l'utilisateur connecte)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.json({ listings: listings.map(publicListing) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('owner', 'name phone');
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });
    res.json({ listing: publicListing(listing) });
  } catch (err) {
    res.status(404).json({ error: 'Annonce introuvable.' });
  }
});

// POST /api/listings (creation, utilisateur connecte)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, category, price, description, city, phone } = req.body;

    if (!title || !category || price === undefined || !description || !city || !phone) {
      return res.status(400).json({ error: 'Tous les champs de l\'annonce sont requis.' });
    }

    const listing = await Listing.create({
      title: title.trim(),
      category,
      price,
      description: description.trim(),
      city: city.trim(),
      phone: phone.trim(),
      owner: req.userId
    });

    const user = await User.findById(req.userId);
    if (user) listingPublishedEmail(user, listing).catch(() => {});

    res.status(201).json({ listing: publicListing(listing) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la publication.' });
  }
});

// PUT /api/listings/:id (modification, proprietaire uniquement)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (String(listing.owner) !== String(req.userId)) {
      return res.status(403).json({ error: 'Tu ne peux modifier que tes propres annonces.' });
    }

    const fields = ['title', 'category', 'price', 'description', 'city', 'phone', 'status'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) listing[f] = req.body[f];
    });

    await listing.save();
    res.json({ listing: publicListing(listing) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la modification.' });
  }
});

// DELETE /api/listings/:id (proprietaire uniquement)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (String(listing.owner) !== String(req.userId)) {
      return res.status(403).json({ error: 'Tu ne peux supprimer que tes propres annonces.' });
    }

    await listing.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

// NOTE : la mise en avant ("featured") ne se fait plus directement ici.
// Voir routes/payments.js : le vendeur envoie une preuve de paiement,
// et c'est l'administrateur qui valide et active le boost.

module.exports = router;