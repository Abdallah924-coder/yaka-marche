const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function ensureAdminAccount() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email && !initialPassword) return;
  if (!email || !initialPassword) {
    console.error('[admin] Provisionnement ignore : definir ADMIN_EMAIL et ADMIN_INITIAL_PASSWORD ensemble.');
    return;
  }
  if (initialPassword.length < 12) {
    throw new Error('ADMIN_INITIAL_PASSWORD doit contenir au moins 12 caracteres.');
  }

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.info('[admin] Le compte administrateur configure existe deja ; mot de passe existant conserve.');
    return;
  }

  const passwordHash = await bcrypt.hash(initialPassword, 12);
  await User.create({
    name: process.env.ADMIN_NAME || 'Administrateur Yaka Marche',
    email,
    phone: process.env.ADMIN_PHONE || 'Non renseigne',
    city: process.env.ADMIN_CITY || '',
    passwordHash
  });

  console.info('[admin] Compte administrateur cree. Connecte-toi avec ADMIN_EMAIL et le mot de passe configure dans Render.');
}

module.exports = { ensureAdminAccount };
