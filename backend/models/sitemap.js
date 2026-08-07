const express = require('express');
const Listing = require('../models/Listing');
const { escapeXml } = require('../utils/seo');

const router = express.Router();

// GET /sitemap.xml
// Genere dynamiquement le sitemap a chaque requete : toujours a jour avec
// les annonces actives, sans etape de build ni fichier a regenerer a la main.
router.get('/sitemap.xml', async (req, res) => {
  try {
    const appUrl = (process.env.APP_URL || 'https://yaka-marche.xyz').replace(/\/$/, '');

    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/annonces', priority: '0.9', changefreq: 'hourly' },
      { loc: '/publier', priority: '0.6', changefreq: 'monthly' }
    ];

    const listings = await Listing.find({ status: 'active' })
      .select('_id updatedAt createdAt')
      .limit(5000);

    const listingUrls = listings.map((l) => ({
      loc: `/annonce?id=${l._id}`,
      lastmod: new Date(l.createdAt).toISOString(),
      priority: '0.7',
      changefreq: 'weekly'
    }));

    const urls = [...staticUrls, ...listingUrls];

    const body = urls.map((u) => `  <url>
    <loc>${escapeXml(appUrl + u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('[sitemap] erreur :', err.message);
    res.status(500).send('Erreur de generation du sitemap.');
  }
});

module.exports = router;