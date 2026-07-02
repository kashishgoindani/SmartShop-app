const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['cashier', 'manager', 'admin', 'staff'],  // ✅ 'staff' add kiya
    default: 'cashier'
  },
  phone: {
    type: String,
    trim: true
  },
  salary: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
