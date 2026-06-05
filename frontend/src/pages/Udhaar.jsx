import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const statusColors = {
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  partial: { bg: 'rgba(6,182,212,0.12)',  color: '#06B6D4', border: 'rgba(6,182,212,0.25)' },
  paid:    { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
};

const emptyForm = { customerName: '', customerPhone: '', amount: '', dueDate: '', notes: '' };

// Check if loan is 1 month old and unpaid
const isOneMonthAlert = (u) => {
  if (u.status === 'paid') return false;
  const created = new Date(u.createdAt);
  const now = new Date();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return diffDays >= 30;
};

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px'
    }}>
      <div style={{
        background: '#1E293B', border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px',
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

function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const color = pct >= 100 ? '#10b981' : pct > 0 ? '#06B6D4' : '#f59e0b';
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Paid: ₨ {paid.toLocaleString()}</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function Udhaar() {
  const [udhaarList, setUdhaarList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [payAmount, setPayAmount] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [listRes, overdueRes] = await Promise.allSettled([
        API.get('/udhaar'),
        API.get('/udhaar/overdue'),
      ]);
      if (listRes.status === 'fulfilled') setUdhaarList(listRes.value.data);
      if (overdueRes.status === 'fulfilled') setOverdueCount(overdueRes.value.data.count || 0);
    } catch {
      toast.error('Loans could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAdd = async () => {
    if (!form.customerName.trim()) return toast.error('Customer name is required');
    if (!form.amount || form.amount <= 0) return toast.error('Enter a valid amount');
    setFormLoading(true);
    try {
      await API.post('/udhaar', { ...form, amount: Number(form.amount) });
      toast.success('Loan has been added!');
      setShowAdd(false);
      setForm(emptyForm);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add loan');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!payAmount || payAmount <= 0) return toast.error('Enter a valid amount');
    const remaining = selected.amount - selected.paidAmount;
    if (Number(payAmount) > remaining) return toast.error(`Remaining amount is ₨ ${remaining.toLocaleString()}`);
    setFormLoading(true);
    try {
      await API.put(`/udhaar/${selected._id}/payment`, { amount: Number(payAmount) });
      toast.success('Payment recorded!');
      setShowPayment(false);
      setPayAmount('');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment could not be recorded');
    } finally {
      setFormLoading(false);
    }
  };

  const isOverdue = (u) => u.dueDate && new Date(u.dueDate) < new Date() && u.status !== 'paid';

  const filtered = udhaarList.filter(u => {
    const matchSearch = u.customerName?.toLowerCase().includes(search.toLowerCase()) ||
                        u.customerPhone?.includes(search);
    const matchStatus = filterStatus === 'All' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const oneMonthAlerts = udhaarList.filter(u => isOneMonthAlert(u));
  const totalLoan = udhaarList.reduce((sum, u) => sum + ((u.amount || 0) - (u.paidAmount || 0)), 0);
  const totalPending = udhaarList.filter(u => u.status !== 'paid').length;
  const totalPaid = udhaarList.filter(u => u.status === 'paid').length;
  const totalAmount = udhaarList.reduce((sum, u) => sum + (u.amount || 0), 0);

  return (
    <div style={{ padding: '32px' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade { animation: fadeIn 0.35s ease forwards; }
        .row-hover:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Add Loan Modal */}
      {showAdd && (
        <Modal title="📋 Add New Loan" onClose={() => { setShowAdd(false); setForm(emptyForm); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label className="auth-label">Customer Name *</label>
                <input className="auth-input" placeholder="Ali Hassan"
                  value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
              </div>
              <div className="field">
                <label className="auth-label">Phone</label>
                <input className="auth-input" placeholder="03XX-XXXXXXX"
                  value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label className="auth-label">Amount (₨) *</label>
                <input className="auth-input" type="number" placeholder="0"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="field">
                <label className="auth-label">Due Date</label>
                <input className="auth-input" type="date"
                  value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  style={{ colorScheme: 'dark' }} />
              </div>
            </div>
            <div className="field">
              <label className="auth-label">Notes</label>
              <input className="auth-input" placeholder="Optional note..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <button className="auth-btn" onClick={handleAdd} disabled={formLoading} style={{ marginTop: '6px' }}>
              {formLoading ? 'Saving...' : 'Add Loan'}
            </button>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      {showPayment && selected && (
        <Modal title="💳 Record Payment" onClose={() => { setShowPayment(false); setPayAmount(''); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '16px'
            }}>
              <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: '0 0 4px' }}>{selected.customerName}</p>
              {selected.customerPhone && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>📞 {selected.customerPhone}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Total', value: selected.amount, color: '#fff' },
                { label: 'Paid', value: selected.paidAmount || 0, color: '#10b981' },
                { label: 'Remaining', value: selected.amount - (selected.paidAmount || 0), color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px', padding: '12px', textAlign: 'center'
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase' }}>{item.label}</p>
                  <p style={{ color: item.color, fontSize: '15px', fontWeight: 700, margin: 0 }}>₨ {item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <ProgressBar paid={selected.paidAmount || 0} total={selected.amount} />

            <div className="field">
              <label className="auth-label">Payment Amount (₨)</label>
              <input className="auth-input" type="number"
                placeholder={`Max: ₨ ${(selected.amount - (selected.paidAmount || 0)).toLocaleString()}`}
                value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[25, 50, 75, 100].map(pct => {
                const amt = Math.round((selected.amount - (selected.paidAmount || 0)) * pct / 100);
                return (
                  <button key={pct} onClick={() => setPayAmount(amt)} style={{
                    padding: '6px 12px', background: 'rgba(99,102,241,0.1)',
                    border: '0.5px solid rgba(99,102,241,0.25)', borderRadius: '8px',
                    color: '#6366F1', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    fontFamily: 'Inter,sans-serif'
                  }}>{pct}% — ₨{amt.toLocaleString()}</button>
                );
              })}
            </div>

            <button className="auth-btn" onClick={handlePayment} disabled={formLoading}>
              {formLoading ? 'Recording...' : '✅ Record Payment'}
            </button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: 0 }}>📋 Loans</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>
            Customer loan tracking — {udhaarList.length} total records
          </p>
        </div>
        <button className="auth-btn" onClick={() => setShowAdd(true)}
          style={{ width: 'auto', padding: '11px 22px', fontSize: '14px' }}>
          + Add Loan
        </button>
      </div>

      {/* 1-Month Alert Banner */}
      {oneMonthAlerts.length > 0 && (
        <div className="fade" style={{
          background: 'rgba(139,92,246,0.08)', border: '0.5px solid rgba(139,92,246,0.3)',
          borderRadius: '12px', padding: '14px 20px', marginBottom: '12px',
          display: 'flex', alignItems: 'flex-start', gap: '12px'
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>🗓️</span>
          <div>
            <p style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
              1 Month Loan Alert — {oneMonthAlerts.length} customer{oneMonthAlerts.length > 1 ? 's' : ''}
            </p>
            <p style={{ color: 'rgba(139,92,246,0.7)', fontSize: '12px', margin: 0 }}>
              {oneMonthAlerts.map(u => u.customerName).join(', ')} — loan has been unpaid for over 1 month.
            </p>
          </div>
        </div>
      )}

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="fade" style={{
          background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.25)',
          borderRadius: '12px', padding: '14px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>🚨</span>
          <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: 500, margin: 0 }}>
            <strong>{overdueCount} customer{overdueCount > 1 ? 's' : ''}</strong> have overdue loans — time to send a reminder!
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '28px', animationDelay: '0.05s' }}>
        {[
          { label: 'Total Receivable', value: `₨ ${totalLoan.toLocaleString()}`, icon: '💰', color: '#f59e0b' },
          { label: 'Total Loan',     value: `₨ ${totalAmount.toLocaleString()}`, icon: '📊', color: '#6366F1' },
          { label: 'Pending',          value: totalPending, icon: '⏳', color: '#ef4444' },
          { label: 'Cleared',          value: totalPaid, icon: '✅', color: '#10b981' },
          { label: '1 Month+',         value: oneMonthAlerts.length, icon: '🗓️', color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${s.color}25`,
            borderRadius: '14px', padding: '18px 20px',
          }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {s.icon} {s.label}
            </p>
            <p style={{ fontSize: typeof s.value === 'string' ? '16px' : '22px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="fade" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', animationDelay: '0.1s' }}>
        <input className="auth-input" placeholder="🔍 Search by name or phone..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'pending', 'partial', 'paid'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', textTransform: 'capitalize',
              background: filterStatus === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: filterStatus === s ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
              color: filterStatus === s ? '#6366F1' : 'rgba(255,255,255,0.5)',
            }}>{s}</button>
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
              {['Customer', 'Amount', 'Progress', 'Due Date', 'Status', 'Action'].map(h => (
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
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} style={{ padding: '16px 18px' }}>
                      <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontSize: '32px', margin: '0 0 10px' }}>📋</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                    {search ? 'No records found' : 'No loans yet — add your first loan!'}
                  </p>
                </td>
              </tr>
            ) : filtered.map((u) => {
              const sc = statusColors[u.status] || statusColors.pending;
              const overdue = isOverdue(u);
              const monthAlert = isOneMonthAlert(u);
              const remaining = u.amount - (u.paidAmount || 0);
              return (
                <tr key={u._id} className="row-hover" style={{
                  borderTop: '0.5px solid rgba(255,255,255,0.05)', transition: 'background 0.15s',
                  background: monthAlert && !overdue ? 'rgba(139,92,246,0.04)' : 'transparent'
                }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: overdue ? 'rgba(239,68,68,0.15)' : monthAlert ? 'rgba(139,92,246,0.15)' : 'rgba(99,102,241,0.15)',
                        border: `0.5px solid ${overdue ? 'rgba(239,68,68,0.3)' : monthAlert ? 'rgba(139,92,246,0.3)' : 'rgba(99,102,241,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                      }}>👤</div>
                      <div>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 500, margin: 0 }}>{u.customerName}</p>
                        {u.customerPhone && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0' }}>📞 {u.customerPhone}</p>}
                        {monthAlert && !overdue && (
                          <span style={{ fontSize: '10px', color: '#8B5CF6', fontWeight: 600 }}>🗓️ 1 month unpaid</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>₨ {u.amount.toLocaleString()}</p>
                    {remaining > 0 && <p style={{ color: '#f59e0b', fontSize: '11px', margin: '2px 0 0' }}>Remaining: ₨ {remaining.toLocaleString()}</p>}
                  </td>
                  <td style={{ padding: '14px 18px', minWidth: '140px' }}>
                    <ProgressBar paid={u.paidAmount || 0} total={u.amount} />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {u.dueDate ? (
                      <span style={{ color: overdue ? '#ef4444' : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: overdue ? 600 : 400 }}>
                        {overdue && '⚠️ '}
                        {new Date(u.dueDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    ) : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600,
                      background: sc.bg, color: sc.color, border: `0.5px solid ${sc.border}`,
                      textTransform: 'capitalize'
                    }}>{u.status}</span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {u.status !== 'paid' ? (
                      <button onClick={() => { setSelected(u); setShowPayment(true); }} style={{
                        padding: '7px 14px', background: 'rgba(16,185,129,0.12)',
                        border: '0.5px solid rgba(16,185,129,0.25)', borderRadius: '8px',
                        color: '#10b981', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        fontFamily: 'Inter,sans-serif'
                      }}>💳 Pay</button>
                    ) : (
                      <span style={{ color: '#10b981', fontSize: '13px' }}>✅ Cleared</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '14px', textAlign: 'right' }}>
          Showing {filtered.length} of {udhaarList.length} records
        </p>
      )}
    </div>
  );
}

export default Udhaar;