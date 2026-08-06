const express = require('express');
const Listing = require('../models/Listing');
const User = require('../models/User');
const SearchAlert = require('../models/SearchAlert');
const { requireAuth } = require('../middleware/auth');
const { listingPublishedEmail, searchAlertEmail } = require('../utils/brevo');

const IMAGE_REQUIRED_CATEGORIES = Listing.IMAGE_REQUIRED_CATEGORIES;

const router = express.Router();

const OWNER_FIELDS = 'name phone ratingAvg ratingCount';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Remet a zero les compteurs "cette semaine" si plus de 7 jours se sont ecoules.
// Modifie le document en memoire, ne sauvegarde pas (appelant responsable du save()).
function applyWeeklyReset(listing) {
  const weekStart = listing.weekStart || listing.createdAt;
  if (Date.now() - new Date(weekStart).getTime() > WEEK_MS) {
    listing.weekStart = new Date();
    listing.viewsThisWeek = 0;
    listing.contactsThisWeek = 0;
  }
}

// Envoie une notification par email a tous les utilisateurs dont une alerte
// correspond a cette nouvelle annonce (hors l'auteur lui-meme).
async function notifyMatchingAlerts(listing) {
  try {
    const alerts = await SearchAlert.find({ user: { $ne: listing.owner } });
    const title = listing.title.toLowerCase();
    const desc = listing.description.toLowerCase();
    const city = listing.city.toLowerCase();

    const matching = alerts.filter((a) => {
      const catOk = !a.category || a.category === 'Toutes' || a.category === listing.category;
      const cityOk = !a.city || city.includes(a.city.toLowerCase());
      const kw = (a.keyword || '').toLowerCase();
      const keywordOk = !kw || title.includes(kw) || desc.includes(kw);
      return catOk && cityOk && keywordOk;
    });

    if (!matching.length) return;

    const userIds = [...new Set(matching.map((a) => String(a.user)))];
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = {};
    users.forEach((u) => { userMap[String(u._id)] = u; });

    const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
    const listingLink = `${appUrl}/annonce?id=${listing._id}`;

    for (const userId of userIds) {
      const user = userMap[userId];
      if (user) searchAlertEmail(user, listing, listingLink).catch(() => {});
    }

    await SearchAlert.updateMany(
      { _id: { $in: matching.map((a) => a._id) } },
      { lastNotifiedAt: new Date() }
    );
  } catch (err) {
    console.error('[alerts] erreur notification :', err.message);
  }
}

function publicListing(listing, opts = {}) {
  const owner = listing.owner && listing.owner.name ? {
    id: listing.owner._id,
    name: listing.owner.name,
    phone: listing.owner.phone,
    ratingAvg: listing.owner.ratingAvg,
    ratingCount: listing.owner.ratingCount
  } : undefined;

  const allImages = listing.images || [];
  const images = opts.thumbnailOnly
    ? (allImages[0] ? [allImages[0]] : [])
    : allImages;

  return {
    id: listing._id,
    title: listing.title,
    category: listing.category,
    price: listing.price,
    description: listing.description,
    city: listing.city,
    phone: listing.phone,
    images,
    featured: listing.featured,
    status: listing.status,
    views: listing.views || 0,
    contactClicks: listing.contactClicks || 0,
    viewsThisWeek: listing.viewsThisWeek || 0,
    contactsThisWeek: listing.contactsThisWeek || 0,
    lastBumpedAt: listing.lastBumpedAt,
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

    let query = Listing.find(filter).populate('owner', OWNER_FIELDS);

    if (sort === 'price_asc') query = query.sort({ featured: -1, price: 1 });
    else if (sort === 'price_desc') query = query.sort({ featured: -1, price: -1 });
    else query = query.sort({ featured: -1, sortDate: -1 });

    const listings = await query.limit(200);
    res.json({ listings: listings.map((l) => publicListing(l, { thumbnailOnly: true })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors du chargement des annonces.' });
  }
});

// GET /api/listings/mine (annonces de l'utilisateur connecte)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.json({ listings: listings.map((l) => publicListing(l, { thumbnailOnly: true })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/listings/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('owner', OWNER_FIELDS);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });

    applyWeeklyReset(listing);
    listing.views = (listing.views || 0) + 1;
    listing.viewsThisWeek = (listing.viewsThisWeek || 0) + 1;
    await listing.save();

    res.json({ listing: publicListing(listing) });
  } catch (err) {
    res.status(404).json({ error: 'Annonce introuvable.' });
  }
});

// POST /api/listings/:id/contact-click
// Trace un clic "Contacter sur WhatsApp" (public, pas besoin d'etre connecte).
router.post('/:id/contact-click', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });

    applyWeeklyReset(listing);
    listing.contactClicks = (listing.contactClicks || 0) + 1;
    listing.contactsThisWeek = (listing.contactsThisWeek || 0) + 1;
    await listing.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(404).json({ error: 'Annonce introuvable.' });
  }
});

// POST /api/listings (creation, utilisateur connecte)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, category, price, description, city, phone, images } = req.body;

    if (!title || !category || price === undefined || !description || !city || !phone) {
      return res.status(400).json({ error: 'Tous les champs de l\'annonce sont requis.' });
    }

    const imagesArr = Array.isArray(images) ? images : [];
    if (imagesArr.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 images par annonce.' });
    }
    if (IMAGE_REQUIRED_CATEGORIES.includes(category) && imagesArr.length < 3) {
      return res.status(400).json({ error: `La categorie "${category}" demande au moins 3 photos.` });
    }

    const listing = await Listing.create({
      title: title.trim(),
      category,
      price,
      description: description.trim(),
      city: city.trim(),
      phone: phone.trim(),
      images: imagesArr,
      owner: req.userId
    });

    const user = await User.findById(req.userId);
    if (user) listingPublishedEmail(user, listing).catch(() => {});
    notifyMatchingAlerts(listing).catch(() => {});
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

    const fields = ['title', 'category', 'price', 'description', 'city', 'phone', 'status', 'images'];
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

const BUMP_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1 fois par semaine

// POST /api/listings/:id/bump
// Relance gratuite : fait remonter l'annonce en haut du tri "plus recentes",
// une fois par semaine maximum.
router.post('/:id/bump', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (String(listing.owner) !== String(req.userId)) {
      return res.status(403).json({ error: 'Tu ne peux relancer que tes propres annonces.' });
    }

    const last = listing.lastBumpedAt || listing.createdAt;
    const elapsed = Date.now() - new Date(last).getTime();

    if (elapsed < BUMP_COOLDOWN_MS) {
      const nextBumpAt = new Date(new Date(last).getTime() + BUMP_COOLDOWN_MS);
      return res.status(429).json({
        error: 'Tu as deja relance cette annonce cette semaine.',
        nextBumpAt
      });
    }

    listing.sortDate = new Date();
    listing.lastBumpedAt = new Date();
    await listing.save();

    res.json({ listing: publicListing(listing) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/listings/:id/favorite
// Ajoute/retire l'annonce des favoris de l'utilisateur connecte (bascule).
router.post('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });

    const user = await User.findById(req.userId);
    const idx = user.favorites.findIndex((f) => String(f) === String(listing._id));
    let favorited;

    if (idx === -1) {
      user.favorites.push(listing._id);
      favorited = true;
    } else {
      user.favorites.splice(idx, 1);
      favorited = false;
    }

    await user.save();
    res.json({ favorited });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/listings/:id/redeem-boost-credit
// Utilise un credit de mise en avant gratuit gagne par parrainage.
router.post('/:id/redeem-boost-credit', requireAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Annonce introuvable.' });
    if (String(listing.owner) !== String(req.userId)) {
      return res.status(403).json({ error: 'Tu ne peux mettre en avant que tes propres annonces.' });
    }
    if (listing.featured) {
      return res.status(400).json({ error: 'Cette annonce est deja mise en avant.' });
    }

    const user = await User.findById(req.userId);
    if (!user || (user.freeBoostCredits || 0) < 1) {
      return res.status(400).json({ error: 'Tu n\'as pas de credit de mise en avant disponible.' });
    }

    user.freeBoostCredits -= 1;
    await user.save();

    listing.featured = true;
    await listing.save();

    res.json({ listing: publicListing(listing), freeBoostCredits: user.freeBoostCredits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;