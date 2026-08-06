const mongoose = require('mongoose');

const CATEGORIES = [
  'Services',
  'Electronique',
  'Mode',
  'Immobilier',
  'Vehicules',
  'Cours & Formation',
  'Maison & Meubles',
  'Alimentation',
  'Beaute & Bien-etre',
  'Sport & Loisirs',
  'Emploi',
  'Bebe & Enfants',
  'Agriculture & Elevage',
  'Autre'
];

// Categories ou au moins 3 photos sont exigees a la publication.
const IMAGE_REQUIRED_CATEGORIES = ['Immobilier', 'Electronique'];

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: CATEGORIES
  },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  images: {
    type: [String], // images en base64 (data URL), compressees cote client
    default: [],
    validate: {
      validator: (arr) => arr.length <= 6,
      message: 'Maximum 6 images par annonce.'
    }
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'vendu', 'archive'], default: 'active' },
  views: { type: Number, default: 0 },
  contactClicks: { type: Number, default: 0 },
  viewsThisWeek: { type: Number, default: 0 },
  contactsThisWeek: { type: Number, default: 0 },
  weekStart: { type: Date, default: Date.now },
  sortDate: { type: Date, default: Date.now }, // date de tri = date de creation, avancee a chaque relance
  lastBumpedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

listingSchema.index({ title: 'text', description: 'text', city: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.IMAGE_REQUIRED_CATEGORIES = IMAGE_REQUIRED_CATEGORIES;