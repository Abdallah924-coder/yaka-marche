// Client API partage par toutes les pages. Le frontend et le backend sont
// servis par le meme serveur Express, donc les appels sont en chemin relatif.
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('yaka_token');
}

function getUser() {
  const raw = localStorage.getItem('yaka_user');
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem('yaka_token', token);
  localStorage.setItem('yaka_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('yaka_token');
  localStorage.removeItem('yaka_user');
}

function logout() {
  clearSession();
  window.location.href = '/';
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/connexion';
  }
}

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch (e) { /* reponse vide */ }

  if (!res.ok) {
    throw new Error(data.error || 'Une erreur est survenue.');
  }
  return data;
}

function waLink(phone, title) {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  const msg = encodeURIComponent('Bonjour, je suis interesse(e) par votre annonce sur Yaka Marche : ' + title);
  return 'https://wa.me/' + digits + '?text=' + msg;
}

function formatPrice(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function showToast(msg, isError) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle('error', !!isError);
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

// Met a jour les liens de nav (Connexion/Inscription vs Tableau de bord/Deconnexion/Admin)
function renderNavAuthState() {
  const user = getUser();
  document.querySelectorAll('[data-auth="guest"]').forEach(el => {
    el.classList.toggle('hidden', !!user);
  });
  document.querySelectorAll('[data-auth="user"]').forEach(el => {
    el.classList.toggle('hidden', !user);
  });
  document.querySelectorAll('[data-auth="admin"]').forEach(el => {
    el.classList.toggle('hidden', !(user && user.isAdmin));
  });
  document.querySelectorAll('[data-user-name]').forEach(el => {
    if (user) el.textContent = user.name;
  });
  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  });
}

// Ajoute un bouton hamburger dans la nav (visible en mobile via CSS) qui
// affiche/masque les liens de navigation.
function initMobileNav() {
  const inner = document.querySelector('nav.topbar .inner');
  const links = document.querySelector('nav.topbar .nav-links');
  if (!inner || !links || inner.querySelector('.nav-hamburger')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-hamburger';
  btn.setAttribute('aria-label', 'Ouvrir le menu');
  btn.innerHTML = '<span></span><span></span><span></span>';

  const actions = inner.querySelector('.nav-actions');
  inner.insertBefore(btn, actions || null);

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('mobile-open');
    btn.classList.toggle('open', open);
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('mobile-open');
      btn.classList.remove('open');
    });
  });
}

// Recharge l'utilisateur depuis le serveur (utile si son statut admin a
// change apres sa derniere connexion, sans avoir a se reconnecter).
async function refreshUserIfNeeded() {
  if (!getToken()) return;
  try {
    const data = await apiFetch('/auth/me');
    localStorage.setItem('yaka_user', JSON.stringify(data.user));
    renderNavAuthState();
  } catch (e) {
    // token invalide/expire : les pages protegees s'en chargeront via requireAuth()
  }
}

function initPage() {
  renderNavAuthState();
  initMobileNav();
  refreshUserIfNeeded();
}

// Execution immediate (le script est charge apres la nav dans le HTML, donc
// les elements existent deja) + reexecution sur pageshow pour couvrir le cas
// d'une page restauree depuis le cache du navigateur (bouton precedent/suivant),
// qui sinon peut encore afficher "Connexion" alors que la session est active.
initPage();
window.addEventListener('pageshow', initPage);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}