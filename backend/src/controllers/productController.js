const Product = require('../models/Product');

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add product — ✅ duplicate check: same naam ho toh stock add karo
const addProduct = async (req, res) => {
  try {
    const { name, category, price, stock, lowStockThreshold, unit } = req.body;

    // Same naam ka product dhundo (case-insensitive)
    const existing = await Product.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });

    if (existing) {
      // ✅ Already exists — stock update karo, naya mat banao
      existing.stock += Number(stock) || 0;
      // Price aur baaki cheezein bhi update kar do agar bheja ho
      if (price) existing.price = price;
      if (category) existing.category = category;
      if (lowStockThreshold) existing.lowStockThreshold = lowStockThreshold;
      if (unit) existing.unit = unit;
      await existing.save();
      return res.status(200).json({ ...existing.toObject(), _merged: true });
    }

    // Naya product banao
    const product = await Product.create({ name: name.trim(), category, price, stock, lowStockThreshold, unit });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProducts, addProduct, updateProduct, deleteProduct };