import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, icon, color, prefix = '', loading }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `0.5px solid ${color}30`,
      borderRadius: '16px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${color}20`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '100px', height: '100px', borderRadius: '50%',
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`
      }} />
      <div style={{
        width: '42px', height: '42px', borderRadius: '12px',
        background: `${color}15`, border: `0.5px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', marginBottom: '14px'
      }}>{icon}</div>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        {label}
      </p>
      {loading ? (
        <div style={{ height: '32px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', width: '60%', animation: 'pulse 1.5s infinite' }} />
      ) : (
        <p style={{ fontSize: '28px', fontWeight: 700, color, letterSpacing: '-0.5px' }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      )}
    </div>
  );
}

function SalesGraph({ salesData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !salesData.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 20, right: 20, bottom: 40, left: 60 };

    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...salesData.map(d => d.amount), 1);
    const steps = salesData.length;
    const xStep = (W - pad.left - pad.right) / Math.max(steps - 1, 1);
    const yScale = (H - pad.top - pad.bottom) / maxVal;

    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ((H - pad.top - pad.bottom) / 4) * i;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val, pad.left - 6, y + 4);
    }

    salesData.forEach((d, i) => {
      if (!d.label) return;
      const x = pad.left + i * xStep;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x, H - 8);
    });

    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    grad.addColorStop(0, 'rgba(99,102,241,0.35)');
    grad.addColorStop(1, 'rgba(99,102,241,0.01)');
    ctx.beginPath();
    salesData.forEach((d, i) => {
      const x = pad.left + i * xStep;
      const y = H - pad.bottom - d.amount * yScale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + (steps - 1) * xStep, H - pad.bottom);
    ctx.lineTo(pad.left, H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    salesData.forEach((d, i) => {
      const x = pad.left + i * xStep;
      const y = H - pad.bottom - d.amount * yScale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    salesData.forEach((d, i) => {
      const x = pad.left + i * xStep;
      const y = H - pad.bottom - d.amount * yScale;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6366F1';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });
  }, [salesData]);

  if (!salesData.length) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📊</p>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No sales data yet</p>
    </div>
  );

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={200}
      style={{ width: '100%', height: '200px', display: 'block' }}
    />
  );
}

function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    todayRevenue: 0, todayOrders: 0, totalProducts: 0, pendingUdhaar: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [salesGraphData, setSalesGraphData] = useState([]);
  const [allSalesData, setAllSalesData] = useState([]);
  const [graphFilter, setGraphFilter] = useState('today');
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const buildGraphData = (sales, filter) => {
    const now = new Date();

    if (filter === 'today') {
      const currentHour = now.getHours();
      const buckets = {};
      for (let i = 7; i >= 0; i--) {
        const h = currentHour - i;
        if (h < 0) continue;
        const label = `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`;
        buckets[h] = { label, amount: 0 };
      }
      sales.forEach(s => {
        const h = new Date(s.createdAt).getHours();
        if (buckets[h] !== undefined) buckets[h].amount += s.totalAmount || 0;
      });
      return Object.values(buckets);
    }

    if (filter === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const buckets = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        buckets[key] = { label: days[d.getDay()], amount: 0 };
      }
      sales.forEach(s => {
        const key = new Date(s.createdAt).toDateString();
        if (buckets[key] !== undefined) buckets[key].amount += s.totalAmount || 0;
      });
      return Object.values(buckets);
    }

    if (filter === 'month') {
      const buckets = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toDateString();
        buckets[key] = { label: `${d.getDate()}/${d.getMonth() + 1}`, amount: 0 };
      }
      sales.forEach(s => {
        const key = new Date(s.createdAt).toDateString();
        if (buckets[key] !== undefined) buckets[key].amount += s.totalAmount || 0;
      });
      return Object.values(buckets).map((b, i) => ({
        ...b, label: i % 5 === 0 ? b.label : ''
      }));
    }

    if (filter === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const buckets = {};
      months.forEach((m, i) => { buckets[i] = { label: m, amount: 0 }; });
      sales.forEach(s => {
        const date = new Date(s.createdAt);
        if (date.getFullYear() === now.getFullYear()) {
          buckets[date.getMonth()].amount += s.totalAmount || 0;
        }
      });
      return Object.values(buckets);
    }

    return [];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes, udhaarRes] = await Promise.allSettled([
        API.get('/sales'),
        API.get('/products'),
        API.get('/udhaar'),
      ]);

      if (salesRes.status === 'fulfilled') {
        const allSales = salesRes.value.data || [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todaySales = allSales.filter(s => new Date(s.createdAt) >= today);
        const revenue = todaySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        setStats(prev => ({ ...prev, todayRevenue: revenue, todayOrders: todaySales.length }));
        setRecentSales(todaySales.slice(0, 5));
        setAllSalesData(allSales);
        setSalesGraphData(buildGraphData(allSales, graphFilter));
      }

      if (productsRes.status === 'fulfilled') {
        const products = productsRes.value.data || [];
        const lowStock = products.filter(p => p.stock <= (p.lowStockThreshold || 5));
        setStats(prev => ({ ...prev, totalProducts: products.length }));
        setLowStockProducts(lowStock.slice(0, 4));
      }

      if (udhaarRes.status === 'fulfilled') {
        const udhaarList = udhaarRes.value.data || [];
        const pending = udhaarList.filter(u => u.status !== 'paid');
        const total = pending.reduce((sum, u) => sum + ((u.amount || 0) - (u.paidAmount || 0)), 0);
        setStats(prev => ({ ...prev, pendingUdhaar: total }));
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Filter change hone pe graph update
  useEffect(() => {
    setSalesGraphData(buildGraphData(allSalesData, graphFilter));
  }, [graphFilter, allSalesData]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ padding: '32px' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .dash-fade { animation: fadeIn 0.4s ease forwards; }
        .filter-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Header */}
      <div className="dash-fade" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>👋</span>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: 0 }}>
              {getGreeting()}, <span style={{ background: 'linear-gradient(135deg,#6366F1,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {user?.name || 'Admin'}
              </span>
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
            Here is your shop overview for today
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '12px', padding: '12px 18px', textAlign: 'right'
        }}>
          <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{timeStr}</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0, marginTop: '2px' }}>{dateStr}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dash-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '32px', animationDelay: '0.1s' }}>
        <StatCard label="Today's Revenue" value={stats.todayRevenue} icon="💰" color="#10b981" prefix="₨ " loading={loading} />
        <StatCard label="Today's Orders"  value={stats.todayOrders}  icon="🛍️" color="#6366F1" loading={loading} />
        <StatCard label="Total Products"  value={stats.totalProducts} icon="📦" color="#06B6D4" loading={loading} />
        <StatCard label="Pending Loans"   value={stats.pendingUdhaar} icon="📋" color="#f59e0b" prefix="₨ " loading={loading} />
      </div>

      {/* Sales Graph */}
      <div className="dash-fade" style={{
        background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', animationDelay: '0.15s'
      }}>
        {/* Graph Header with Filters */}
        <div style={{
          padding: '18px 22px', borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
        }}>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0 }}>📊 Sales Graph</h3>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {['today', 'week', 'month', 'year'].map(f => (
              <button key={f} className="filter-btn" onClick={() => setGraphFilter(f)} style={{
                padding: '5px 14px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 500, transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
                background: graphFilter === f ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                color: graphFilter === f ? '#818cf8' : 'rgba(255,255,255,0.4)',
                border: graphFilter === f ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <span style={{
              fontSize: '11px', padding: '4px 10px', marginLeft: '4px',
              background: 'rgba(99,102,241,0.15)', color: '#6366F1',
              border: '0.5px solid rgba(99,102,241,0.25)', borderRadius: '20px', fontWeight: 500
            }}>Live • 30s</span>
          </div>
        </div>

        <div style={{ padding: '16px 22px 8px' }}>
          {loading ? (
            <div style={{ height: '200px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          ) : (
            <SalesGraph salesData={salesGraphData} />
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Sales */}
        <div className="dash-fade" style={{
          background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', overflow: 'hidden', animationDelay: '0.2s'
        }}>
          <div style={{
            padding: '18px 22px', borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0 }}>📈 Recent Sales</h3>
            <span style={{
              fontSize: '11px', padding: '4px 10px',
              background: 'rgba(99,102,241,0.15)', color: '#6366F1',
              border: '0.5px solid rgba(99,102,241,0.25)', borderRadius: '20px', fontWeight: 500
            }}>Today: {stats.todayOrders}</span>
          </div>

          {loading ? (
            <div style={{ padding: '22px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '80px', height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div style={{ padding: '40px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🛒</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No sales today yet</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Customer', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 22px', textAlign: 'left', fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, i) => (
                  <tr key={sale._id || i} style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 22px', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                      {sale.customer || sale.customerName || 'Walk-in'}
                    </td>
                    <td style={{ padding: '12px 22px', color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
                      ₨ {(sale.totalAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 22px' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                        background: sale.paymentType === 'udhaar' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: sale.paymentType === 'udhaar' ? '#f59e0b' : '#10b981',
                        border: `0.5px solid ${sale.paymentType === 'udhaar' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                        fontWeight: 500
                      }}>{sale.paymentType === 'udhaar' ? 'Loan' : 'Paid'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="dash-fade" style={{
          background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', overflow: 'hidden', animationDelay: '0.3s'
        }}>
          <div style={{
            padding: '18px 22px', borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0 }}>⚠️ Low Stock Alert</h3>
            {lowStockProducts.length > 0 && (
              <span style={{
                fontSize: '11px', padding: '4px 10px',
                background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                border: '0.5px solid rgba(239,68,68,0.25)', borderRadius: '20px', fontWeight: 500
              }}>{lowStockProducts.length} item(s) running low</span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '22px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                  <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              ))}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div style={{ padding: '40px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 10px' }}>✅</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>All products are well stocked</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {lowStockProducts.map((product, i) => (
                <div key={product._id || i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 22px', borderBottom: i < lowStockProducts.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none'
                }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0
                  }}>📦</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, margin: 0 }}>{product.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0' }}>
                      Remaining: {product.stock} units
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    background: product.stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                    color: product.stock === 0 ? '#ef4444' : '#f59e0b',
                    border: `0.5px solid ${product.stock === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
                  }}>
                    {product.stock === 0 ? 'Out' : 'Low'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
