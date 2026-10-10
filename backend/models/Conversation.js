const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  listingTitle: { type: String, required: true, trim: true, maxlength: 120 },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  buyerUnread: { type: Number, default: 0, min: 0 },
  sellerUnread: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

conversationSchema.index({ buyer: 1, seller: 1, listing: 1 }, { unique: true });
conversationSchema.index({ buyer: 1, lastMessageAt: -1 });
conversationSchema.index({ seller: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
