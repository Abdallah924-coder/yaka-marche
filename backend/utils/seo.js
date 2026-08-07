const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(str) {
  return escapeHtml(str);
}

// Lit un template HTML statique (ex: public/annonce.html) et remplace les
// balises <title>, meta description/canonical/og/twitter par des valeurs
// dynamiques calculees cote serveur (utile pour que les robots des reseaux
// sociaux, qui n'executent pas le JavaScript, voient un aperçu correct).
function renderWithMeta(templateFile, meta) {
  const filePath = path.join(PUBLIC_DIR, templateFile);
  let html = fs.readFileSync(filePath, 'utf8');

  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const image = escapeHtml(meta.image);
  const robots = escapeHtml(meta.robots || 'index, follow');

  html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);

  html = html.replace(
    /<meta name="description" content=".*?">/,
    `<meta name="description" content="${description}">`
  );
  html = html.replace(
    /<link rel="canonical" href=".*?">/,
    `<link rel="canonical" href="${url}">`
  );
  html = html.replace(
    /<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="${title}">`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?">/,
    `<meta property="og:description" content="${description}">`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?">/,
    `<meta property="og:url" content="${url}">`
  );
  html = html.replace(
    /<meta property="og:image" content=".*?">/,
    `<meta property="og:image" content="${image}">`
  );
  html = html.replace(
    /<meta name="twitter:title" content=".*?">/,
    `<meta name="twitter:title" content="${title}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?">/,
    `<meta name="twitter:description" content="${description}">`
  );
  html = html.replace(
    /<meta name="twitter:image" content=".*?">/,
    `<meta name="twitter:image" content="${image}">`
  );
  html = html.replace(
    /<meta name="robots" content=".*?">/,
    `<meta name="robots" content="${robots}">`
  );

  if (meta.jsonLd) {
    const ldScript = `<script type="application/ld+json" id="ld-json">${JSON.stringify(meta.jsonLd)}</script>`;
    if (/<script type="application\/ld\+json" id="ld-json">.*?<\/script>/s.test(html)) {
      html = html.replace(/<script type="application\/ld\+json" id="ld-json">.*?<\/script>/s, ldScript);
    } else {
      html = html.replace('</head>', `${ldScript}\n</head>`);
    }
  }

  return html;
}

module.exports = { escapeHtml, escapeXml, renderWithMeta };