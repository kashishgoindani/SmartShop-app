const mongoose = require('mongoose');

const udhaarSchema = new mongoose.Schema({
  customerName:  { type: String, required: true },
  customerPhone: { type: String, required: false, default: '' },  // ✅ required hata diya
  amount:        { type: Number, required: true },
  paidAmount:    { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  dueDate:   { type: Date, default: null },
  notes:     { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Udhaar', udhaarSchema);