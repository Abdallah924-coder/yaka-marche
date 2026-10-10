const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listingTitle: { type: String, required: true, trim: true, maxlength: 120 },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 50 },
  totalPrice: { type: Number, required: true, min: 0 },
  buyerName: { type: String, required: true, trim: true, maxlength: 100 },
  buyerPhone: { type: String, required: true, trim: true, maxlength: 30 },
  sellerName: { type: String, required: true, trim: true, maxlength: 100 },
  sellerPhone: { type: String, required: true, trim: true, maxlength: 30 },
  deliveryCity: { type: String, required: true, trim: true, maxlength: 100 },
  deliveryAddress: { type: String, trim: true, maxlength: 300, default: '' },
  buyerNote: { type: String, trim: true, maxlength: 500, default: '' },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'cash', 'other'],
    default: null
  },
  paymentReference: { type: String, trim: true, maxlength: 100, default: '' },
  status: {
    type: String,
    enum: ['pending_payment', 'payment_reported', 'confirmed', 'completed', 'cancelled'],
    default: 'pending_payment'
  },
  paymentReportedAt: { type: Date, default: null },
  paymentConfirmedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
