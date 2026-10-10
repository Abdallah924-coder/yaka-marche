const express = require('express');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicOrder(order, userId) {
  const isSeller = String(order.seller) === String(userId);
  return {
    id: order._id,
    listingId: order.listing,
    listingTitle: order.listingTitle,
    unitPrice: order.unitPrice,
    quantity: order.quantity,
    totalPrice: order.totalPrice,
    buyer: {
      name: order.buyerName,
      ...(isSeller ? { phone: order.buyerPhone } : {})
    },
    seller: {
      name: order.sellerName,
      phone: order.sellerPhone
    },
    deliveryCity: order.deliveryCity,
    deliveryAddress: order.deliveryAddress,
    buyerNote: order.buyerNote,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    status: order.status,
    paymentReportedAt: order.paymentReportedAt,
    paymentConfirmedAt: order.paymentConfirmedAt,
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    role: isSeller ? 'seller' : 'buyer'
  };
}

async function loadAuthorizedOrder(orderId, userId, res) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400).json({ error: 'Identifiant de commande invalide.' });
    return null;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404).json({ error: 'Commande introuvable.' });
    return null;
  }
  if (String(order.buyer) !== String(userId) && String(order.seller) !== String(userId)) {
    res.status(403).json({ error: 'Tu ne peux pas consulter cette commande.' });
    return null;
  }
  return order;
}

// GET /api/orders/mine
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ buyer: req.userId }, { seller: req.userId }]
    }).sort({ createdAt: -1 }).limit(100);

    res.json({ orders: orders.map((order) => publicOrder(order, req.userId)) });
  } catch (err) {
    console.error('[orders] Failed to load user orders:', err);
    res.status(500).json({ error: 'Impossible de charger les commandes.' });
  }
});

// POST /api/orders
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Informations de commande invalides.' });
    }
    const { listingId, quantity, buyerPhone, deliveryCity, deliveryAddress, buyerNote } = req.body;
    const quantityNumber = Number(quantity);

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Annonce invalide.' });
    }
    if (!Number.isInteger(quantityNumber) || quantityNumber < 1 || quantityNumber > 50) {
      return res.status(400).json({ error: 'La quantité doit être comprise entre 1 et 50.' });
    }
    if (typeof buyerPhone !== 'string' || !buyerPhone.trim() ||
        typeof deliveryCity !== 'string' || !deliveryCity.trim()) {
      return res.status(400).json({ error: 'Téléphone et ville de livraison sont requis.' });
    }
    if (buyerPhone.trim().length > 30 || deliveryCity.trim().length > 100 ||
        (deliveryAddress && (typeof deliveryAddress !== 'string' || deliveryAddress.length > 300)) ||
        (buyerNote && (typeof buyerNote !== 'string' || buyerNote.length > 500))) {
      return res.status(400).json({ error: 'Les informations de livraison sont trop longues ou invalides.' });
    }

    const [listing, buyer] = await Promise.all([
      Listing.findById(listingId),
      User.findById(req.userId)
    ]);
    if (!listing || listing.status !== 'active') {
      return res.status(404).json({ error: 'Cette annonce n’est plus disponible.' });
    }
    if (!buyer) return res.status(401).json({ error: 'Session invalide, reconnecte-toi.' });
    if (String(listing.owner) === String(req.userId)) {
      return res.status(400).json({ error: 'Tu ne peux pas commander ta propre annonce.' });
    }

    const seller = await User.findById(listing.owner);
    if (!seller) return res.status(404).json({ error: 'Vendeur introuvable.' });

    const order = await Order.create({
      listing: listing._id,
      buyer: buyer._id,
      seller: seller._id,
      listingTitle: listing.title,
      unitPrice: listing.price,
      quantity: quantityNumber,
      totalPrice: listing.price * quantityNumber,
      buyerName: buyer.name,
      buyerPhone: buyerPhone.trim(),
      sellerName: seller.name,
      sellerPhone: listing.phone,
      deliveryCity: deliveryCity.trim(),
      deliveryAddress: (deliveryAddress || '').trim(),
      buyerNote: (buyerNote || '').trim()
    });

    res.status(201).json({ order: publicOrder(order, req.userId) });
  } catch (err) {
    console.error('[orders] Failed to create order:', err);
    res.status(500).json({ error: 'Impossible de créer la commande.' });
  }
});

// Buyer reports having paid the seller directly. This is not a verified payment.
router.post('/:id/report-payment', requireAuth, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Informations de paiement invalides.' });
    }
    const order = await loadAuthorizedOrder(req.params.id, req.userId, res);
    if (!order) return;
    if (String(order.buyer) !== String(req.userId)) {
      return res.status(403).json({ error: 'Seul l’acheteur peut signaler le paiement.' });
    }
    if (order.status !== 'pending_payment') {
      return res.status(409).json({ error: 'Cette commande ne peut plus recevoir de signalement de paiement.' });
    }

    const { paymentMethod, paymentReference } = req.body;
    if (!['mobile_money', 'cash', 'other'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Mode de paiement invalide.' });
    }
    if (paymentReference !== undefined &&
        (typeof paymentReference !== 'string' || paymentReference.length > 100)) {
      return res.status(400).json({ error: 'Référence de paiement invalide.' });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, buyer: req.userId, status: 'pending_payment' },
      {
        $set: {
          paymentMethod,
          paymentReference: (paymentReference || '').trim(),
          paymentReportedAt: new Date(),
          status: 'payment_reported'
        }
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(409).json({ error: 'La commande a changé. Actualise la page.' });
    res.json({ order: publicOrder(updated, req.userId) });
  } catch (err) {
    console.error('[orders] Failed to report payment:', err);
    res.status(500).json({ error: 'Impossible de signaler le paiement.' });
  }
});

// Seller confirms receipt after independently checking their account/cash.
router.post('/:id/confirm-payment', requireAuth, async (req, res) => {
  try {
    const order = await loadAuthorizedOrder(req.params.id, req.userId, res);
    if (!order) return;
    if (String(order.seller) !== String(req.userId)) {
      return res.status(403).json({ error: 'Seul le vendeur peut confirmer le paiement.' });
    }
    if (order.status !== 'payment_reported') {
      return res.status(409).json({ error: 'Aucun paiement signalé pour cette commande.' });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, seller: req.userId, status: 'payment_reported' },
      { $set: { status: 'confirmed', paymentConfirmedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(409).json({ error: 'La commande a changé. Actualise la page.' });
    res.json({ order: publicOrder(updated, req.userId) });
  } catch (err) {
    console.error('[orders] Failed to confirm payment:', err);
    res.status(500).json({ error: 'Impossible de confirmer le paiement.' });
  }
});

router.post('/:id/complete', requireAuth, async (req, res) => {
  try {
    const order = await loadAuthorizedOrder(req.params.id, req.userId, res);
    if (!order) return;
    if (String(order.seller) !== String(req.userId)) {
      return res.status(403).json({ error: 'Seul le vendeur peut terminer la commande.' });
    }
    if (order.status !== 'confirmed') {
      return res.status(409).json({ error: 'Le paiement doit être confirmé avant de terminer la commande.' });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, seller: req.userId, status: 'confirmed' },
      { $set: { status: 'completed', completedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(409).json({ error: 'La commande a changé. Actualise la page.' });
    res.json({ order: publicOrder(updated, req.userId) });
  } catch (err) {
    console.error('[orders] Failed to complete order:', err);
    res.status(500).json({ error: 'Impossible de terminer la commande.' });
  }
});

router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const order = await loadAuthorizedOrder(req.params.id, req.userId, res);
    if (!order) return;
    if (String(order.buyer) !== String(req.userId) && String(order.seller) !== String(req.userId)) {
      return res.status(403).json({ error: 'Tu ne peux pas annuler cette commande.' });
    }
    if (order.status !== 'pending_payment') {
      return res.status(409).json({ error: 'Une commande après signalement de paiement doit être réglée directement avec le vendeur.' });
    }

    const updated = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: 'pending_payment',
        $or: [{ buyer: req.userId }, { seller: req.userId }]
      },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!updated) return res.status(409).json({ error: 'La commande a changé. Actualise la page.' });
    res.json({ order: publicOrder(updated, req.userId) });
  } catch (err) {
    console.error('[orders] Failed to cancel order:', err);
    res.status(500).json({ error: 'Impossible d’annuler la commande.' });
  }
});

module.exports = router;
