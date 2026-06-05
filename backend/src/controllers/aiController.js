require('dotenv').config();
const Groq = require('groq-sdk');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Udhaar = require('../models/Udhaar');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const chat = async (req, res) => {
  try {
    const { message } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await Sale.find({ createdAt: { $gte: today } });
    const totalRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    const pendingUdhaar = await Udhaar.find({ status: { $ne: 'paid' } });
    const totalUdhaar = pendingUdhaar.reduce(
      (sum, u) => sum + (u.amount - u.paidAmount), 0
    );

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',  // ✅ UPDATED
      messages: [
        {
          role: 'system',
          content: `Aap ShopSmart AI hain — ek Pakistani dukaan ka smart assistant.
          Hamesha Urdu mein jawab do. Concise aur helpful raho.
          Aaj ki information:
          - Aaj ki total sales: PKR ${totalRevenue}
          - Aaj ke orders: ${todaySales.length}
          - Low stock products: ${lowStockProducts.map(p => p.name).join(', ') || 'Koi nahi'}
          - Pending udhaar: PKR ${totalUdhaar} (${pendingUdhaar.length} customers)`
        },
        {
          role: 'user',
          content: message
        }
      ]
    });

    const reply = response.choices[0].message.content;

    res.json({
      reply,
      shopData: {
        totalRevenue,
        todaySales: todaySales.length,
        lowStockCount: lowStockProducts.length,
        pendingUdhaar: totalUdhaar
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { chat };