import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const paymentColors = {
  cash:   { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  udhaar: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
};

function Badge({ type }) {
  const c = type === 'udhaar' ? paymentColors.udhaar : paymentColors.cash;
  const label = type === 'udhaar' ? 'Loan' : 'Cash';
  return (
    <span style={{
      fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600,
      background: c.bg, color: c.color, border: `0.5px solid ${c.border}`
    }}>{label}</span>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px'
    }}>
      <div style={{
        background: '#1E293B', border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '580px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            width: '32px', height: '32px', fontSize: '16px'
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('All');
  const [report, setReport] = useState(null);

  const [customer, setCustomer] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [dueDate, setDueDate] = useState('');                // ✅ NEW
  const [items, setItems] = useState([{ product: '', quantity: 1 }]);

  const resetForm = () => {
    setCustomer('');
    setCustomerPhone('');
    setPaymentType('cash');
    setDueDate('');                                          // ✅ NEW
    setItems([{ product: '', quantity: 1 }]);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes, reportRes] = await Promise.allSettled([
        API.get('/sales'),
        API.get('/products'),
        API.get('/sales/daily-report'),
      ]);
      if (salesRes.status === 'fulfilled') setSales(salesRes.value.data);
      if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data);
      if (reportRes.status === 'fulfilled') setReport(reportRes.value.data);
    } catch {
      toast.error('Data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const addItem = () => setItems([...items, { product: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const getProductById = (id) => products.find(p => p._id === id);
  const calcTotal = () => items.reduce((sum, item) => {
    const p = getProductById(item.product);
    return sum + (p ? p.price * (item.quantity || 0) : 0);
  }, 0);

  const handleCreate = async () => {
    const validItems = items.filter(i => i.product && i.quantity > 0);
    if (validItems.length === 0) return toast.error('Please add at least one product');
    for (let item of validItems) {
      const p = getProductById(item.product);
      if (p && item.quantity > p.stock) return toast.error(`${p.name} only has ${p.stock} in stock`);
    }
    if (paymentType === 'udhaar' && !customer.trim()) return toast.error('Customer name is required for loan sales');
    setFormLoading(true);
    try {
      await API.post('/sales', {
        items: validItems,
        paymentType,
        customer: customer.trim() || 'Walk-in',
        customerPhone: customerPhone.trim() || '',
        dueDate: paymentType === 'udhaar' ? (dueDate || null) : null,  // ✅ NEW
      });
      toast.success(paymentType === 'udhaar' ? 'Sale recorded & added to Loans!' : 'Sale recorded!');
      setShowNew(false);
      resetForm();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale could not be created');
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = sales.filter(s => {
    const matchSearch = (s.customer || 'Walk-in').toLowerCase().includes(search.toLowerCase());
    const matchPay = filterPayment === 'All' || s.paymentType === filterPayment;
    return matchSearch && matchPay;
  });

  const todayTotal = report?.totalRevenue || 0;
  const todayCount = report?.totalSales || 0;
  const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const avgSale = sales.length ? Math.round(totalRevenue / sales.length) : 0;

  return (
    <div style={{ padding: '32px' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade { animation: fadeIn 0.35s ease forwards; }
        .row-hover:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {showNew && (
        <Modal title="💰 New Sale" onClose={() => { setShowNew(false); resetForm(); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label className="auth-label">Customer Name {paymentType === 'udhaar' && <span style={{color:'#ef4444'}}>*</span>}</label>
                <input className="auth-input" placeholder="Walk-in"
                  value={customer} onChange={e => setCustomer(e.target.value)} />
              </div>
              <div className="field">
                <label className="auth-label">Payment Type</label>
                <select className="auth-input" value={paymentType}
                  onChange={e => { setPaymentType(e.target.value); setDueDate(''); }}
                  style={{ cursor: 'pointer' }}>
                  <option value="cash" style={{ background: '#1E293B' }}>Cash</option>
                  <option value="udhaar" style={{ background: '#1E293B' }}>Loan</option>
                </select>
              </div>
            </div>

            {/* ✅ Phone + Due Date side by side for Loan */}
            {paymentType === 'udhaar' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label className="auth-label">Customer Phone</label>
                  <input className="auth-input" placeholder="03XX-XXXXXXX"
                    value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                </div>
                <div className="field">
                  <label className="auth-label">Due Date</label>
                  <input
                    className="auth-input"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ colorScheme: 'dark', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}

            {paymentType === 'udhaar' && (
              <div style={{
                background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.25)',
                borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center'
              }}>
                <span style={{ fontSize: '16px' }}>📋</span>
                <p style={{ color: '#f59e0b', fontSize: '13px', margin: 0 }}>
                  This sale will be automatically added to the <strong>Loans</strong> section.
                </p>
              </div>
            )}

            <div>
              <label className="auth-label" style={{ marginBottom: '10px', display: 'block' }}>
                Products ({items.length} item{items.length > 1 ? 's' : ''})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item, i) => {
                  const prod = getProductById(item.product);
                  return (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select className="auth-input" value={item.product}
                        onChange={e => updateItem(i, 'product', e.target.value)}
                        style={{ flex: 2, cursor: 'pointer' }}>
                        <option value="" style={{ background: '#1E293B' }}>-- Select Product --</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id} style={{ background: '#1E293B' }}>
                            {p.name} (Stock: {p.stock}) — ₨{p.price}
                          </option>
                        ))}
                      </select>
                      <input className="auth-input" type="number" min="1"
                        max={prod?.stock || 999} value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                        style={{ flex: 1 }} />
                      {prod && (
                        <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          ₨ {(prod.price * item.quantity).toLocaleString()}
                        </span>
                      )}
                      {items.length > 1 && (
                        <button onClick={() => removeItem(i)} style={{
                          background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.25)',
                          borderRadius: '8px', color: '#ef4444', cursor: 'pointer',
                          width: '32px', height: '38px', fontSize: '16px', flexShrink: 0
                        }}>✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={addItem} style={{
                marginTop: '10px', padding: '8px 16px', background: 'rgba(99,102,241,0.1)',
                border: '0.5px solid rgba(99,102,241,0.25)', borderRadius: '8px',
                color: '#6366F1', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                fontFamily: 'Inter,sans-serif'
              }}>+ Add Item</button>
            </div>

            <div style={{
              background: 'rgba(16,185,129,0.08)', border: '0.5px solid rgba(16,185,129,0.2)',
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Total Amount</span>
              <span style={{ color: '#10b981', fontSize: '22px', fontWeight: 700 }}>
                ₨ {calcTotal().toLocaleString()}
              </span>
            </div>

            <button className="auth-btn" onClick={handleCreate} disabled={formLoading}>
              {formLoading ? 'Recording...' : '✅ Record Sale'}
            </button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: 0 }}>💰 Sales</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>Track your daily sales & revenue</p>
        </div>
        <button className="auth-btn" onClick={() => setShowNew(true)} style={{ width: 'auto', padding: '11px 22px', fontSize: '14px' }}>
          + New Sale
        </button>
      </div>

      {/* Stats */}
      <div className="fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '28px', animationDelay: '0.05s' }}>
        {[
          { label: "Today's Revenue", value: `₨ ${todayTotal.toLocaleString()}`, icon: '📅', color: '#10b981' },
          { label: "Today's Sales",   value: todayCount, icon: '🛍️', color: '#6366F1' },
          { label: 'Total Revenue',   value: `₨ ${totalRevenue.toLocaleString()}`, icon: '💎', color: '#06B6D4' },
          { label: 'Avg Sale Value',  value: `₨ ${avgSale.toLocaleString()}`, icon: '📊', color: '#f59e0b' },
          { label: 'Top Item Today',  value: report?.topItem?.name || '—', icon: '🏆', color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${s.color}25`,
            borderRadius: '14px', padding: '18px 20px',
          }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {s.icon} {s.label}
            </p>
            <p style={{ fontSize: typeof s.value === 'string' && s.value.length > 10 ? '14px' : '22px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="fade" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', animationDelay: '0.1s' }}>
        <input className="auth-input" placeholder="🔍 Search by customer..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { val: 'All', label: 'All' },
            { val: 'cash', label: 'Cash' },
            { val: 'udhaar', label: 'Loan' },
          ].map(pt => (
            <button key={pt.val} onClick={() => setFilterPayment(pt.val)} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              background: filterPayment === pt.val ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: filterPayment === pt.val ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
              color: filterPayment === pt.val ? '#6366F1' : 'rgba(255,255,255,0.5)',
            }}>{pt.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="fade" style={{
        background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', overflow: 'hidden', animationDelay: '0.15s'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
              {['Customer', 'Items', 'Total Amount', 'Payment', 'Sold By', 'Date & Time'].map(h => (
                <th key={h} style={{
                  padding: '14px 18px', textAlign: 'left', fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => (
                  <td key={j} style={{ padding: '16px 18px' }}>
                    <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  </td>
                ))}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🛒</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                    {search ? 'No sales found' : 'No sales yet — record your first sale!'}
                  </p>
                </td>
              </tr>
            ) : filtered.map((sale) => (
              <tr key={sale._id} className="row-hover" style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: 'rgba(99,102,241,0.15)', border: '0.5px solid rgba(99,102,241,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                    }}>👤</div>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{sale.customer || 'Walk-in'}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {(sale.items || []).slice(0, 2).map((item, i) => (
                      <span key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                        {item.product?.name || 'Product'} × {item.quantity}
                      </span>
                    ))}
                    {sale.items?.length > 2 && <span style={{ color: '#6366F1', fontSize: '11px' }}>+{sale.items.length - 2} more</span>}
                  </div>
                </td>
                <td style={{ padding: '14px 18px', color: '#10b981', fontSize: '15px', fontWeight: 700 }}>
                  ₨ {(sale.totalAmount || 0).toLocaleString()}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <Badge type={sale.paymentType || 'cash'} />
                </td>
                <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                  {sale.soldBy?.name || '—'}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    {new Date(sale.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span><br />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                    {new Date(sale.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '14px', textAlign: 'right' }}>
          Showing {filtered.length} of {sales.length} sales
        </p>
      )}
    </div>
  );
}

export default Sales;