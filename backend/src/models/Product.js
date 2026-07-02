const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  unit: { type: String, default: 'pcs' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
