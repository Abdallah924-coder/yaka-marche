const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Un seul avis par personne et par vendeur (un nouvel envoi met a jour l'avis existant).
reviewSchema.index({ seller: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);