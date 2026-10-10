const Listing = require('../models/Listing');

const FEATURED_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

async function initializeFeaturedListings() {
  const featuredUntil = new Date(Date.now() + FEATURED_DURATION_MS);
  const result = await Listing.updateMany(
    {
      featured: true,
      $or: [
        { featuredUntil: null },
        { featuredUntil: { $exists: false } }
      ]
    },
    { $set: { featuredUntil } }
  );

  if (result.modifiedCount > 0) {
    console.log(`[marketplace] ${result.modifiedCount} ancienne(s) mise(s) en avant expire(nt) dans 14 jours.`);
  }

  return expireFeaturedListings();
}

async function expireFeaturedListings() {
  const result = await Listing.updateMany(
    { featured: true, featuredUntil: { $lte: new Date() } },
    { $set: { featured: false } }
  );

  if (result.modifiedCount > 0) {
    console.log(`[marketplace] ${result.modifiedCount} mise(s) en avant payante(s) expirée(s).`);
  }
}

module.exports = {
  FEATURED_DURATION_MS,
  initializeFeaturedListings,
  expireFeaturedListings
};
