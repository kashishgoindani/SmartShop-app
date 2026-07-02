const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentType: { type: String, enum: ['cash', 'udhaar'], default: 'cash' },
  customer: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
