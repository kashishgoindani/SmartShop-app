import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['General', 'Food', 'Beverages', 'Electronics', 'Clothing', 'Medicine', 'Stationery', 'Other'];
const UNITS = ['pcs', 'kg', 'g', 'liter', 'ml', 'dozen', 'box', 'pack'];

const categoryColors = {
  Food: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
  Beverages: { bg: 'rgba(6,182,212,0.12)', color: '#06B6D4', border: 'rgba(6,182,212,0.25)' },
  Electronics: { bg: 'rgba(99,102,241,0.12)', color: '#6366F1', border: 'rgba(99,102,241,0.25)' },
  Clothing: { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: 'rgba(139,92,246,0.25)' },
  Medicine: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
  Stationery: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  General: { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.15)' },
  Other: { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.15)' },
};

const emptyForm = { name: '', category: 'General', price: '', stock: '', lowStockThreshold: '5', unit: 'pcs' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px'
    }}>
      <div style={{
        background: '#1E293B', border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px',
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

function ProductForm({ form, setForm, onSubmit, loading, submitLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="field">
        <label className="auth-label">Product Name *</label>
        <input className="auth-input" placeholder="e.g. Basmati Rice" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="field">
          <label className="auth-label">Category</label>
          <select className="auth-input" value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            style={{ cursor: 'pointer' }}>
            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1E293B' }}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="auth-label">Unit</label>
          <select className="auth-input" value={form.unit}
            onChange={e => setForm({ ...form, unit: e.target.value })}
            style={{ cursor: 'pointer' }}>
            {UNITS.map(u => <option key={u} value={u} style={{ background: '#1E293B' }}>{u}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div className="field">
          <label className="auth-label">Price (₨)</label>
          <input className="auth-input" type="number" placeholder="0" value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="field">
          <label className="auth-label">Stock</label>
          <input className="auth-input" type="number" placeholder="0" value={form.stock}
            onChange={e => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="field">
          <label className="auth-label">Low Stock At</label>
          <input className="auth-input" type="number" placeholder="5" value={form.lowStockThreshold}
            onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })} />
        </div>
      </div>
      <button className="auth-btn" onClick={onSubmit} disabled={loading} style={{ marginTop: '8px' }}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/products');
      setProducts(data);
    } catch {
      toast.error('Products has not loaded ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return toast.error('Product name required');
    if (!form.price || form.price <= 0) return toast.error('Enter Valid price ');
    if (form.stock === '') return toast.error('Add Stock');
    setFormLoading(true);
    try {
      await API.post('/products', {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
      });
      toast.success('Product added!');
      setShowAdd(false);
      setForm(emptyForm);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Does not added');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name.trim()) return toast.error('Product name required');
    setFormLoading(true);
    try {
      await API.put(`/products/${selected._id}`, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold) || 5,
      });
      toast.success('Product has been updated!');
      setShowEdit(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Does not updated');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await API.delete(`/products/${selected._id}`);
      toast.success('Product has been deleted!');
      setShowDelete(false);
      fetchProducts();
    } catch {
      toast.error('Does not deleted');
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (product) => {
    setSelected(product);
    setForm({
      name: product.name,
      category: product.category || 'General',
      price: product.price,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold || 5,
      unit: product.unit || 'pcs',
    });
    setShowEdit(true);
  };

  const openDelete = (product) => {
    setSelected(product);
    setShowDelete(true);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <div style={{ padding: '32px' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadeIn 0.35s ease forwards; }
        .row-hover:hover { background: rgba(255,255,255,0.04) !important; }
        .action-btn { background: transparent; border: none; cursor: pointer; padding: '6px'; border-radius: '6px'; transition: all 0.2s; }
      `}</style>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="➕ Add New Product" onClose={() => { setShowAdd(false); setForm(emptyForm); }}>
          <ProductForm form={form} setForm={setForm} onSubmit={handleAdd} loading={formLoading} submitLabel="Add Product" />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="✏️ Edit Product" onClose={() => setShowEdit(false)}>
          <ProductForm form={form} setForm={setForm} onSubmit={handleEdit} loading={formLoading} submitLabel="Save Changes" />
        </Modal>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <Modal title="🗑️ Delete Product" onClose={() => setShowDelete(false)}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              "{selected?.name}" Do  you want to delete?
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '28px' }}>
              Can not Undo this action.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDelete(false)} style={{
                flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px', fontFamily: 'Inter,sans-serif'
              }}>Cancel</button>
              <button onClick={handleDelete} disabled={formLoading} style={{
                flex: 1, padding: '12px', background: 'rgba(239,68,68,0.15)',
                border: '0.5px solid rgba(239,68,68,0.35)', borderRadius: '10px',
                color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Inter,sans-serif'
              }}>{formLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Page Header */}
      <div className="fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: 0 }}>📦 Products</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>
            Manage your inventory — {products.length} total products
          </p>
        </div>
        <button className="auth-btn" onClick={() => setShowAdd(true)}
          style={{ width: 'auto', padding: '11px 22px', fontSize: '14px' }}>
          + Add Product
        </button>
      </div>

      {/* Stats Row */}
      <div className="fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '28px', animationDelay: '0.05s' }}>
        {[
          { label: 'Total Products', value: products.length, icon: '📦', color: '#6366F1' },
          { label: 'Inventory Value', value: `₨ ${totalValue.toLocaleString()}`, icon: '💎', color: '#10b981' },
          { label: 'Low Stock', value: lowStockCount, icon: '⚠️', color: '#f59e0b' },
          { label: 'Out of Stock', value: outOfStock, icon: '🚫', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${s.color}25`,
            borderRadius: '14px', padding: '18px 20px',
          }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              {s.icon} {s.label}
            </p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="fade" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', animationDelay: '0.1s' }}>
        <input
          className="auth-input"
          placeholder="🔍 Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px' }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', transition: 'all 0.2s',
              background: filterCat === cat ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: filterCat === cat ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
              color: filterCat === cat ? '#6366F1' : 'rgba(255,255,255,0.5)',
            }}>{cat}</button>
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
              {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
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
                  <p style={{ fontSize: '32px', margin: '0 0 10px' }}>📭</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                    {search ? 'We have not any Product yet' : 'We have not any product yet firstly add the product!'}
                  </p>
                </td>
              </tr>
            ) : filtered.map((p) => {
              const isLow = p.stock <= (p.lowStockThreshold || 5) && p.stock > 0;
              const isOut = p.stock === 0;
              const cat = categoryColors[p.category] || categoryColors.General;
              return (
                <tr key={p._id} className="row-hover" style={{ borderTop: '0.5px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: cat.bg, border: `0.5px solid ${cat.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', flexShrink: 0
                      }}>📦</div>
                      <div>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 500, margin: 0 }}>{p.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0' }}>{p.unit || 'pcs'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      fontSize: '12px', padding: '4px 10px', borderRadius: '20px',
                      background: cat.bg, color: cat.color, border: `0.5px solid ${cat.border}`,
                      fontWeight: 500
                    }}>{p.category || 'General'}</span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#10b981', fontSize: '14px', fontWeight: 600 }}>
                    ₨ {(p.price || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 18px', color: isOut ? '#ef4444' : isLow ? '#f59e0b' : 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600 }}>
                    {p.stock}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: 600,
                      background: isOut ? 'rgba(239,68,68,0.15)' : isLow ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
                      color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981',
                      border: `0.5px solid ${isOut ? 'rgba(239,68,68,0.3)' : isLow ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.25)'}`,
                    }}>
                      {isOut ? '🚫 Out of Stock' : isLow ? '⚠️ Low Stock' : '✅ In Stock'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openEdit(p)} style={{
                        padding: '7px 14px', background: 'rgba(99,102,241,0.12)',
                        border: '0.5px solid rgba(99,102,241,0.25)', borderRadius: '8px',
                        color: '#6366F1', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        fontFamily: 'Inter,sans-serif', transition: 'all 0.2s'
                      }}>Edit</button>
                      <button onClick={() => openDelete(p)} style={{
                        padding: '7px 14px', background: 'rgba(239,68,68,0.1)',
                        border: '0.5px solid rgba(239,68,68,0.25)', borderRadius: '8px',
                        color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        fontFamily: 'Inter,sans-serif', transition: 'all 0.2s'
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '14px', textAlign: 'right' }}>
          Showing {filtered.length} of {products.length} products
        </p>
      )}
    </div>
  );
}

export default Products;