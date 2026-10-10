const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Listing = require('../models/Listing');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function isParticipant(conversation, userId) {
  return String(conversation.buyer) === String(userId) ||
    String(conversation.seller) === String(userId);
}

function publicConversation(conversation, userId) {
  const isBuyer = String(conversation.buyer) === String(userId);
  return {
    id: conversation._id,
    listingId: conversation.listing,
    listingTitle: conversation.listingTitle,
    buyer: conversation.buyer,
    seller: conversation.seller,
    otherRole: isBuyer ? 'seller' : 'buyer',
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: isBuyer ? conversation.buyerUnread : conversation.sellerUnread
  };
}

async function findParticipantConversation(id, userId, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Identifiant de conversation invalide.' });
    return null;
  }
  const conversation = await Conversation.findById(id);
  if (!conversation) {
    res.status(404).json({ error: 'Conversation introuvable.' });
    return null;
  }
  if (!isParticipant(conversation, userId)) {
    res.status(403).json({ error: 'Tu ne peux pas consulter cette conversation.' });
    return null;
  }
  return conversation;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ buyer: req.userId }, { seller: req.userId }]
    }).sort({ lastMessageAt: -1 }).limit(100);
    res.json({ conversations: conversations.map((item) => publicConversation(item, req.userId)) });
  } catch (err) {
    console.error('[messages] Failed to load conversations:', err);
    res.status(500).json({ error: 'Impossible de charger les conversations.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Message invalide.' });
    }
    const { listingId, text } = req.body;
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Annonce invalide.' });
    }
    if (typeof text !== 'string' || !text.trim() || text.trim().length > 2000) {
      return res.status(400).json({ error: 'Le message doit contenir entre 1 et 2000 caractères.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'active') {
      return res.status(404).json({ error: 'Cette annonce n’est plus disponible.' });
    }
    if (String(listing.owner) === String(req.userId)) {
      return res.status(400).json({ error: 'Tu ne peux pas démarrer une conversation avec toi-même.' });
    }

    let conversation;
    try {
      conversation = await Conversation.findOneAndUpdate(
        { listing: listing._id, buyer: req.userId, seller: listing.owner },
        {
          $setOnInsert: {
            listingTitle: listing.title,
            lastMessage: '',
            lastMessageAt: new Date(),
            buyerUnread: 0,
            sellerUnread: 0
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    } catch (err) {
      if (err.code !== 11000) throw err;
      conversation = await Conversation.findOne({
        listing: listing._id,
        buyer: req.userId,
        seller: listing.owner
      });
    }
    if (!conversation) throw new Error('Could not create or load conversation.');

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.userId,
      text: text.trim()
    });
    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversation._id },
      {
        $set: { lastMessage: message.text, lastMessageAt: message.createdAt },
        $inc: { sellerUnread: 1 }
      },
      { new: true }
    );

    res.status(201).json({
      conversation: publicConversation(updatedConversation, req.userId),
      message: { id: message._id, sender: message.sender, text: message.text, createdAt: message.createdAt }
    });
  } catch (err) {
    console.error('[messages] Failed to start conversation:', err);
    res.status(500).json({ error: 'Impossible d’envoyer le message.' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const conversation = await findParticipantConversation(req.params.id, req.userId, res);
    if (!conversation) return;

    const isBuyer = String(conversation.buyer) === String(req.userId);
    const unreadFilter = {
      conversation: conversation._id,
      sender: { $ne: req.userId },
      readAt: null
    };
    await Message.updateMany(unreadFilter, { $set: { readAt: new Date() } });
    if (isBuyer) {
      conversation.buyerUnread = 0;
      await Conversation.updateOne({ _id: conversation._id }, { $set: { buyerUnread: 0 } });
    } else {
      conversation.sellerUnread = 0;
      await Conversation.updateOne({ _id: conversation._id }, { $set: { sellerUnread: 0 } });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: -1 })
      .limit(500);
    messages.reverse();
    res.json({
      conversation: publicConversation(conversation, req.userId),
      messages: messages.map((message) => ({
        id: message._id,
        sender: message.sender,
        text: message.text,
        createdAt: message.createdAt,
        readAt: message.readAt
      }))
    });
  } catch (err) {
    console.error('[messages] Failed to load conversation:', err);
    res.status(500).json({ error: 'Impossible de charger cette conversation.' });
  }
});

router.post('/:id', requireAuth, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Message invalide.' });
    }
    const conversation = await findParticipantConversation(req.params.id, req.userId, res);
    if (!conversation) return;
    const text = req.body.text;
    if (typeof text !== 'string' || !text.trim() || text.trim().length > 2000) {
      return res.status(400).json({ error: 'Le message doit contenir entre 1 et 2000 caractères.' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.userId,
      text: text.trim()
    });
    const unreadField = String(conversation.buyer) === String(req.userId)
      ? 'sellerUnread'
      : 'buyerUnread';
    await Conversation.updateOne(
      { _id: conversation._id },
      {
        $set: { lastMessage: message.text, lastMessageAt: message.createdAt },
        $inc: { [unreadField]: 1 }
      }
    );

    res.status(201).json({
      message: { id: message._id, sender: message.sender, text: message.text, createdAt: message.createdAt }
    });
  } catch (err) {
    console.error('[messages] Failed to send message:', err);
    res.status(500).json({ error: 'Impossible d’envoyer le message.' });
  }
});

module.exports = router;
