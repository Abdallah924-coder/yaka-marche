// Envoi d'emails transactionnels via l'API HTTP de Brevo (ex-Sendinblue).
// Documentation : https://developers.brevo.com/reference/sendtransacemail

async function sendEmail({ to, toName, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.log('[brevo] BREVO_API_KEY manquante - email non envoye a', to);
    return { skipped: true };
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_SENDER_EMAIL || 'contact@worldifyai.com',
          name: process.env.BREVO_SENDER_NAME || 'Yaka Marche'
        },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[brevo] echec envoi email :', res.status, errText);
      return { error: true, status: res.status };
    }

    return await res.json();
  } catch (err) {
    console.error('[brevo] erreur reseau :', err.message);
    return { error: true, message: err.message };
  }
}

function footer() {
  return '<p style="color:#888; font-size:12px; margin-top:24px;">Yaka Marche - un produit WORLDIFYAI, by Devoue.</p>';
}

function welcomeEmail(user) {
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Bienvenue sur Yaka Marche',
    htmlContent: `
      <div style="font-family:sans-serif; padding:24px; color:#111;">
        <h2>Bienvenue, ${user.name} !</h2>
        <p>Ton compte Yaka Marche est cree. Tu peux des maintenant publier une annonce
        ou contacter un vendeur directement sur WhatsApp.</p>
        ${footer()}
      </div>
    `
  });
}

function loginAlertEmail(user) {
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Nouvelle connexion a ton compte Yaka Marche',
    htmlContent: `
      <div style="font-family:sans-serif; padding:24px; color:#111;">
        <h2>Nouvelle connexion detectee</h2>
        <p>Une connexion a ton compte Yaka Marche vient d'avoir lieu, le
        ${new Date().toLocaleString('fr-FR')}.</p>
        <p>Si ce n'est pas toi, change ton mot de passe des que possible.</p>
        ${footer()}
      </div>
    `
  });
}

function listingPublishedEmail(user, listing) {
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Ton annonce est en ligne',
    htmlContent: `
      <div style="font-family:sans-serif; padding:24px; color:#111;">
        <h2>Annonce publiee</h2>
        <p>Ton annonce "<strong>${listing.title}</strong>" est maintenant visible sur Yaka Marche.</p>
        <p>Tu peux la retrouver et la gerer depuis ton tableau de bord.</p>
        ${footer()}
      </div>
    `
  });
}

function boostPendingEmail(user, listingTitle) {
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Demande de mise en avant recue',
    htmlContent: `
      <div style="font-family:sans-serif; padding:24px; color:#111;">
        <h2>Demande recue</h2>
        <p>Ta demande de mise en avant pour "<strong>${listingTitle}</strong>" a bien ete recue,
        avec ta preuve de paiement.</p>
        <p>Elle sera activee des qu'un administrateur aura verifie le paiement.</p>
        ${footer()}
      </div>
    `
  });
}

function boostApprovedEmail(user, listingTitle) {
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Ton annonce est mise en avant',
    htmlContent: `
      <div style="font-family:sans-serif; padding:24px; color:#111;">
        <h2>Annonce mise en avant</h2>
        <p>Ton paiement a ete valide. Ton annonce "<strong>${listingTitle}</strong>" apparait
        maintenant en tete des resultats.</p>
        ${footer()}
      </div>
    `
  });
}
function resetPasswordEmail(user, resetLink) {
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Reinitialisation de ton mot de passe Yaka Marche',
    htmlContent: `
      <div style="font-family:sans-serif; padding:24px; color:#111;">
        <h2>Reinitialiser ton mot de passe</h2>
        <p>Tu as demande a reinitialiser le mot de passe de ton compte Yaka Marche.
        Clique sur le lien ci-dessous (valable 1 heure) :</p>
        <p style="margin:20px 0;">
          <a href="${resetLink}" style="background:#FFD43B; color:#141200; padding:12px 22px;
          border-radius:8px; text-decoration:none; font-weight:600;">Choisir un nouveau mot de passe</a>
        </p>
        <p style="color:#888; font-size:13px;">Si tu n'es pas a l'origine de cette demande, ignore cet email :
        ton mot de passe actuel reste inchange.</p>
        ${footer()}
      </div>
    `
  });
}

function searchAlertEmail(user, listing, alertAppUrl) {
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: `Nouvelle annonce : ${listing.title}`,
    htmlContent: `
      <div style="font-family:sans-serif; padding:24px; color:#111;">
        <h2>Une annonce correspond a ton alerte</h2>
        <p><strong>${listing.title}</strong> - ${listing.category} - ${listing.city}</p>
        <p style="margin:20px 0;">
          <a href="${alertAppUrl}" style="background:#FFD43B; color:#141200; padding:12px 22px;
          border-radius:8px; text-decoration:none; font-weight:600;">Voir l'annonce</a>
        </p>
        <p style="color:#888; font-size:13px;">Tu reçois cet email car tu as cree une alerte sur Yaka Marche.
        Tu peux la supprimer depuis la page "Alertes" de ton compte.</p>
        ${footer()}
      </div>
    `
  });
}

function referralCreditEmail(user, totalReferrals) {
  return sendEmail({
    to: user.email,
    toName: user.name,
    subject: 'Tu as gagne une mise en avant gratuite !',
    htmlContent: `
      <div style="font-family:sans-serif; padding:24px; color:#111;">
        <h2>Bravo, ${user.name} !</h2>
        <p>Grace a tes parrainages (${totalReferrals} inscriptions via ton lien), tu viens de debloquer
        une mise en avant gratuite sur Yaka Marche.</p>
        <p>Utilise-la sur l'annonce de ton choix depuis la page de mise en avant.</p>
        ${footer()}
      </div>
    `
  });
}

module.exports = {
  sendEmail,
  welcomeEmail,
  loginAlertEmail,
  listingPublishedEmail,
  boostPendingEmail,
  boostApprovedEmail,
  resetPasswordEmail,
  searchAlertEmail,
  referralCreditEmail
};