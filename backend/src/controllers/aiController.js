require('dotenv').config();
const Groq = require('groq-sdk');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Udhaar = require('../models/Udhaar');
const Staff = require('../models/Staff');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

    // ── SALES ──────────────────────────────────────────────
    const [todaySales, weeklySales, monthlySales] = await Promise.all([
      Sale.find({ createdAt: { $gte: today } }).populate('items.product soldBy'),
      Sale.find({ createdAt: { $gte: weekAgo } }).populate('items.product soldBy'),
      Sale.find({ createdAt: { $gte: monthAgo } }).populate('items.product soldBy'),
    ]);

    const todayRevenue = todaySales.reduce((s, x) => s + x.totalAmount, 0);
    const weekRevenue  = weeklySales.reduce((s, x) => s + x.totalAmount, 0);
    const monthRevenue = monthlySales.reduce((s, x) => s + x.totalAmount, 0);

    // Product-wise units sold (weekly)
    const productUnits = {};
    weeklySales.forEach(sale => {
      sale.items?.forEach(item => {
        const name = item.product?.name || 'Unknown';
        productUnits[name] = (productUnits[name] || 0) + (item.quantity || 1);
      });
    });
    const sortedProducts = Object.entries(productUnits).sort((a, b) => b[1] - a[1]);
    const bestSeller  = sortedProducts[0];
    const worstSeller = sortedProducts[sortedProducts.length - 1];

    // Staff-wise sales (weekly)
    const staffSales = {};
    weeklySales.forEach(sale => {
      const name = sale.soldBy?.name || 'Unknown';
      staffSales[name] = (staffSales[name] || 0) + sale.totalAmount;
    });

    // Customer frequency (monthly)
    const customerFreq = {};
    monthlySales.forEach(sale => {
      if (sale.customer) {
        customerFreq[sale.customer] = (customerFreq[sale.customer] || 0) + 1;
      }
    });
    const topCustomers = Object.entries(customerFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // ── PRODUCTS ───────────────────────────────────────────
    const allProducts = await Product.find({});
    const lowStock    = allProducts.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));
    const outOfStock  = allProducts.filter(p => p.stock === 0);
    const inStock     = allProducts.filter(p => p.stock > (p.lowStockThreshold || 5));

    // ── UDHAAR ─────────────────────────────────────────────
    const allUdhaar      = await Udhaar.find({});
    const pendingUdhaar  = allUdhaar.filter(u => u.status !== 'paid');
    const paidUdhaar     = allUdhaar.filter(u => u.status === 'paid');
    const totalPending   = pendingUdhaar.reduce((s, u) => s + (u.amount - u.paidAmount), 0);
    const totalRecovered = paidUdhaar.reduce((s, u) => s + u.amount, 0);

    // ── STAFF ──────────────────────────────────────────────
    const staffList       = await Staff.find({});
    const activeStaff     = staffList.filter(s => s.isActive);
    const totalSalaryBill = activeStaff.reduce((s, x) => s + (x.salary || 0), 0);

    // ── SYSTEM PROMPT ──────────────────────────────────────
    const systemPrompt = `Aap ShopSmart AI hain — ek Pakistani dukaan ka real-time smart assistant.
Hamesha Roman Urdu mein jawab do. Friendly, concise aur helpful raho.
Specific cheez poochi ho toh exact data do. Calculations clearly dikhao.
Agar koi cheez database mein nahi hai toh clearly bolo "record nahi mila".

════════════════════════════════
📊 SALES OVERVIEW
════════════════════════════════
Aaj:
  Revenue : PKR ${todayRevenue.toLocaleString()}
  Orders  : ${todaySales.length}
  Cash    : ${todaySales.filter(s => s.paymentType === 'cash').length} sales
  Udhaar  : ${todaySales.filter(s => s.paymentType === 'udhaar').length} sales

Is Hafte (7 din):
  Revenue : PKR ${weekRevenue.toLocaleString()}
  Orders  : ${weeklySales.length}

Is Mahine (30 din):
  Revenue : PKR ${monthRevenue.toLocaleString()}
  Orders  : ${monthlySales.length}

════════════════════════════════
🏆 PRODUCT PERFORMANCE (weekly)
════════════════════════════════
Best Seller  : ${bestSeller  ? `${bestSeller[0]} — ${bestSeller[1]} units`  : 'Data nahi hai'}
Worst Seller : ${worstSeller ? `${worstSeller[0]} — ${worstSeller[1]} units` : 'Data nahi hai'}

Sab products ki weekly sales:
${sortedProducts.length
  ? sortedProducts.map(([name, qty]) => `  - ${name}: ${qty} units sold`).join('\n')
  : '  Koi sales nahi is hafte'}

════════════════════════════════
📦 INVENTORY (${allProducts.length} total products)
════════════════════════════════
${allProducts.map(p =>
  `  - ${p.name}: stock=${p.stock}, price=PKR ${p.price}, threshold=${p.lowStockThreshold || 5}`
).join('\n')}

✅ In Stock    (${inStock.length})   : ${inStock.map(p => p.name).join(', ')    || 'Koi nahi'}
⚠️ Low Stock   (${lowStock.length})  : ${lowStock.map(p => `${p.name}(${p.stock})`).join(', ') || 'Koi nahi'}
🚫 Out of Stock (${outOfStock.length}): ${outOfStock.map(p => p.name).join(', ') || 'Koi nahi'}

════════════════════════════════
💳 UDHAAR / LOAN
════════════════════════════════
Total pending  : PKR ${totalPending.toLocaleString()} (${pendingUdhaar.length} customers)
Total recovered: PKR ${totalRecovered.toLocaleString()} (${paidUdhaar.length} paid)

Pending customers:
${pendingUdhaar.length
  ? pendingUdhaar.map(u =>
      `  - ${u.customerName}: PKR ${(u.amount - u.paidAmount).toLocaleString()} baki (total tha PKR ${u.amount.toLocaleString()})`
    ).join('\n')
  : '  Koi pending udhaar nahi'}

════════════════════════════════
👥 STAFF (${staffList.length} total, ${activeStaff.length} active)
════════════════════════════════
Total salary bill: PKR ${totalSalaryBill.toLocaleString()}/month

${staffList.map(s =>
  `  - ${s.name}: role=${s.role}, salary=PKR ${(s.salary || 0).toLocaleString()}, phone=${s.phone || 'N/A'}, status=${s.isActive ? 'Active' : 'Inactive'}`
).join('\n') || '  Koi staff nahi'}

Staff weekly sales performance:
${Object.entries(staffSales).length
  ? Object.entries(staffSales).sort((a, b) => b[1] - a[1]).map(([name, amt]) =>
      `  - ${name}: PKR ${amt.toLocaleString()} ki sales ki`
    ).join('\n')
  : '  Data nahi hai'}

════════════════════════════════
🤝 TOP CUSTOMERS (last 30 days)
════════════════════════════════
${topCustomers.length
  ? topCustomers.map(([name, visits]) => `  - ${name}: ${visits} baar aya`).join('\n')
  : '  Customer data nahi hai'}`;

    // ── GROQ CALL ──────────────────────────────────────────
    const conversationHistory = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;

    res.json({
      reply,
      shopData: {
        totalRevenue: todayRevenue,
        todaySales: todaySales.length,
        lowStockCount: lowStock.length,
        pendingUdhaar: totalPending
      }
    });

  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { chat };
