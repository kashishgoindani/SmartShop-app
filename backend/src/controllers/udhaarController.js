const Udhaar = require('../models/Udhaar');

// Loan add karo (manual)
const addUdhaar = async (req, res) => {
  try {
    const { customerName, customerPhone, amount, dueDate, notes } = req.body;
    const udhaar = await Udhaar.create({
      customerName,
      customerPhone: customerPhone || '',
      amount,
      dueDate: dueDate || null,
      notes,
      createdBy: req.user.id
    });
    res.status(201).json(udhaar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Sab loans lo
const getUdhaar = async (req, res) => {
  try {
    const udhaarList = await Udhaar.find().populate('createdBy', 'name');
    res.json(udhaarList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Payment karo
const makePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const udhaar = await Udhaar.findById(req.params.id);
    if (!udhaar) return res.status(404).json({ message: 'Udhaar not found' });

    udhaar.paidAmount += amount;

    if (udhaar.paidAmount >= udhaar.amount) {
      udhaar.status = 'paid';
    } else if (udhaar.paidAmount > 0) {
      udhaar.status = 'partial';
    }

    await udhaar.save();
    res.json(udhaar);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Overdue — due date guzar gayi aur paid nahi
const getOverdue = async (req, res) => {
  try {
    const today = new Date();
    const overdue = await Udhaar.find({
      dueDate: { $lt: today },
      status: { $ne: 'paid' }
    });
    res.json({
      count: overdue.length,
      overdue,
      urduMessage: `${overdue.length} customers ka udhaar overdue hai!`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 1 Month+ — 30 din se zyada purane unpaid loans
const getOneMonthOld = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldLoans = await Udhaar.find({
      createdAt: { $lte: thirtyDaysAgo },
      status: { $ne: 'paid' }
    });
    res.json({
      count: oldLoans.length,
      loans: oldLoans
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addUdhaar, getUdhaar, makePayment, getOverdue, getOneMonthOld };