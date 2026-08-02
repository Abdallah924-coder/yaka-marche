const mongoose = require('mongoose');

const boostRequestSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String, enum: ['momo', 'crypto'], required: true },
  amountFcfa: { type: Number, required: true },
  proofImage: { type: String, required: true }, // image en base64 (data URL)
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
});

module.exports = mongoose.model('BoostRequest', boostRequestSchema);