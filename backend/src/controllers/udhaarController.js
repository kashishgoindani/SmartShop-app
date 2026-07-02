const Udhaar = require('../models/Udhaar');

const addUdhaar = async (req, res) => {
  try {
    const { customerName, customerPhone, amount, dueDate, notes } = req.body;
    const udhaar = await Udhaar.create({
      shopId: req.user.id,
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

const getUdhaar = async (req, res) => {
  try {
    const udhaarList = await Udhaar.find({ shopId: req.user.id }).populate('createdBy', 'name');
    res.json(udhaarList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const makePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const udhaar = await Udhaar.findOne({ _id: req.params.id, shopId: req.user.id });
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

const getOverdue = async (req, res) => {
  try {
    const today = new Date();
    const overdue = await Udhaar.find({
      shopId: req.user.id,
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

const getOneMonthOld = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldLoans = await Udhaar.find({
      shopId: req.user.id,
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
