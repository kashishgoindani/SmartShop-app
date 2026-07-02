const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Udhaar = require('../models/Udhaar');

const createSale = async (req, res) => {
  try {
    const { items, paymentType, customer, customerPhone, dueDate } = req.body;
    let totalAmount = 0;

    for (let item of items) {
      const product = await Product.findOne({ _id: item.product, shopId: req.user.id });
      if (!product) return res.status(404).json({ message: `Product not found: ${item.product}` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Low stock: ${product.name}` });
      product.stock -= item.quantity;
      await product.save();
      totalAmount += product.price * item.quantity;
    }

    const sale = await Sale.create({
      shopId: req.user.id,
      items,
      totalAmount,
      soldBy: req.user.id,
      paymentType,
      customer
    });

    if (paymentType === 'udhaar' || paymentType === 'Loan') {
      await Udhaar.create({
        shopId: req.user.id,
        customerName: customer || 'Walk-in',
        customerPhone: customerPhone || '',
        amount: totalAmount,
        paidAmount: 0,
        status: 'pending',
        dueDate: dueDate || null,
        createdBy: req.user.id,
        notes: `Auto-added from Sale #${sale._id}`
      });
    }

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSales = async (req, res) => {
  try {
    const sales = await Sale.find({ shopId: req.user.id })
      .populate('items.product', 'name price')
      .populate('soldBy', 'name');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getDailyReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ shopId: req.user.id, createdAt: { $gte: today } })
      .populate('items.product', 'name');
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSales = sales.length;
    const itemMap = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const name = item.product?.name || 'Unknown';
        itemMap[name] = (itemMap[name] || 0) + item.quantity;
      });
    });
    const topItem = Object.entries(itemMap).sort((a, b) => b[1] - a[1])[0];
    res.json({
      date: today, totalSales, totalRevenue,
      topItem: topItem ? { name: topItem[0], quantity: topItem[1] } : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createSale, getSales, getDailyReport };
