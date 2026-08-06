const mongoose = require('mongoose');

const searchAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: 'Toutes' }, // 'Toutes' = toutes categories
  city: { type: String, trim: true, default: '' },
  keyword: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastNotifiedAt: { type: Date, default: null }
});

module.exports = mongoose.model('SearchAlert', searchAlertSchema);