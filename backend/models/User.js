const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  city: { type: String, trim: true, default: '' },
  passwordHash: { type: String, required: true },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  resetTokenHash: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
