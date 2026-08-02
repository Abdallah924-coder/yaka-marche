const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Services', 'Electronique', 'Mode', 'Immobilier', 'Vehicules', 'Cours & Formation', 'Autre']
  },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'vendu', 'archive'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

listingSchema.index({ title: 'text', description: 'text', city: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
