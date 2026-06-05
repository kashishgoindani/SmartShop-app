import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const ROLES = ['manager', 'cashier', 'staff'];

const roleColors = {
  manager: { bg: 'rgba(99,102,241,0.12)',  color: '#6366F1', border: 'rgba(99,102,241,0.25)' },
  cashier:  { bg: 'rgba(6,182,212,0.12)',   color: '#06B6D4', border: 'rgba(6,182,212,0.25)' },
  staff:    { bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.15)' },
};

const emptyForm = { name: '', email: '', password: '', role: 'cashier', phone: '', salary: '' };

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

function StaffForm({ form, setForm, onSubmit, loading, submitLabel, isEdit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="field">
          <label className="auth-label">Full Name *</label>
          <input className="auth-input" placeholder="Ahmed Khan"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label className="auth-label">Role</label>
          <select className="auth-input" value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            style={{ cursor: 'pointer' }}>
            {ROLES.map(r => <option key={r} value={r} style={{ background: '#1E293B', textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label className="auth-label">Email *</label>
        <input className="auth-input" type="email" placeholder="staff@example.com"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      {!isEdit && (
        <div className="field">
          <label className="auth-label">Password *</label>
          <input className="auth-input" type="password" placeholder="Min 6 characters"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="field">
          <label className="auth-label">Phone</label>
          <input className="auth-input" placeholder="03XX-XXXXXXX"
            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field">
          <label className="auth-label">Monthly Salary (₨)</label>
          <input className="auth-input" type="number" placeholder="0"
            value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
        </div>
      </div>
      <button className="auth-btn" onClick={onSubmit} disabled={loading} style={{ marginTop: '6px' }}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}

function getInitials(name) {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
}

const avatarColors = ['#6366F1', '#8B5CF6', '#06B6D4', '#10b981', '#f59e0b', '#ef4444'];

function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/staff');
      setStaffList(data);
    } catch {
      toast.error('Staff load nahi hua');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return toast.error('Name required ');
    if (!form.email.trim()) return toast.error('Email required ');
    if (!form.password || form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setFormLoading(true);
    try {
      await API.post('/staff', { ...form, salary: Number(form.salary) || 0 });
      toast.success('Staff member has been added!');
      setShowAdd(false);
      setForm(emptyForm);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Does not added');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name.trim()) return toast.error('Name required');
    setFormLoading(true);
    try {
      await API.put(`/staff/${selected._id}`, {
        name: form.name, role: form.role, phone: form.phone,
        salary: Number(form.salary) || 0
      });
      toast.success('Staff updated!');
      setShowEdit(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Does not Updated');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await API.delete(`/staff/${selected._id}`);
      toast.success('Staff member removed!');
      setShowDelete(false);
      fetchStaff();
    } catch {
      toast.error('Does not Deleted');
    } finally {
      setFormLoading(false);
    }
  };

  const openEdit = (member) => {
    setSelected(member);
    setForm({ name: member.name, email: member.email, password: '', role: member.role, phone: member.phone || '', salary: member.salary || '' });
    setShowEdit(true);
  };

  const filtered = staffList.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) ||
                        s.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'All' || s.role === filterRole;
    return matchSearch && matchRole;
  });

  const totalSalary = staffList.reduce((sum, s) => sum + (s.salary || 0), 0);
  const managers = staffList.filter(s => s.role === 'manager').length;
  const cashiers = staffList.filter(s => s.role === 'cashier').length;

  return (
    <div style={{ padding: '32px' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade { animation: fadeIn 0.35s ease forwards; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(99,102,241,0.15); }
        .row-hover:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="👤 Add Staff Member" onClose={() => { setShowAdd(false); setForm(emptyForm); }}>
          <StaffForm form={form} setForm={setForm} onSubmit={handleAdd} loading={formLoading} submitLabel="Add Staff Member" isEdit={false} />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="✏️ Edit Staff Member" onClose={() => setShowEdit(false)}>
          <StaffForm form={form} setForm={setForm} onSubmit={handleEdit} loading={formLoading} submitLabel="Save Changes" isEdit={true} />
        </Modal>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <Modal title="🗑️ Remove Staff Member" onClose={() => setShowDelete(false)}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              "{selected?.name}" Do you want to remove?
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '28px' }}>
              account has been deleted Permanently.
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
              }}>{formLoading ? 'Removing...' : 'Haan, Remove Karo'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: 0 }}>👥 Staff</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '4px' }}>
            Manage your team — {staffList.length} member{staffList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="auth-btn" onClick={() => setShowAdd(true)}
          style={{ width: 'auto', padding: '11px 22px', fontSize: '14px' }}>
          + Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '28px', animationDelay: '0.05s' }}>
        {[
          { label: 'Total Staff',     value: staffList.length, icon: '👥', color: '#6366F1' },
          { label: 'Managers',        value: managers,          icon: '🎯', color: '#8B5CF6' },
          { label: 'Cashiers',        value: cashiers,          icon: '💳', color: '#06B6D4' },
          { label: 'Monthly Payroll', value: `₨ ${totalSalary.toLocaleString()}`, icon: '💰', color: '#10b981' },
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
      <div className="fade" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', animationDelay: '0.1s' }}>
        <input className="auth-input" placeholder="🔍 Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', ...ROLES].map(r => (
            <button key={r} onClick={() => setFilterRole(r)} style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter,sans-serif', textTransform: 'capitalize',
              background: filterRole === r ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: filterRole === r ? '0.5px solid rgba(99,102,241,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
              color: filterRole === r ? '#6366F1' : 'rgba(255,255,255,0.5)',
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Staff Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '14px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: '11px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', width: '60%', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '60px', textAlign: 'center'
        }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>👥</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            {search ? 'Koi staff member nahi mila' : 'Abhi koi staff nahi — pehla member add karo!'}
          </p>
        </div>
      ) : (
        <div className="fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px', animationDelay: '0.15s' }}>
          {filtered.map((member, idx) => {
            const rc = roleColors[member.role] || roleColors.staff;
            const avatarColor = avatarColors[idx % avatarColors.length];
            return (
              <div key={member._id} className="card-hover" style={{
                background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: '16px', padding: '22px', transition: 'all 0.25s', cursor: 'default'
              }}>
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                    background: `${avatarColor}20`, border: `2px solid ${avatarColor}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700, color: avatarColor
                  }}>{getInitials(member.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.name}
                    </p>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600,
                      background: rc.bg, color: rc.color, border: `0.5px solid ${rc.border}`,
                      textTransform: 'capitalize', marginTop: '4px', display: 'inline-block'
                    }}>{member.role}</span>
                  </div>
                </div>

                {/* Info rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px' }}>📧</span>
                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.email}
                    </span>
                  </div>
                  {member.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px' }}>📞</span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>{member.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px' }}>💰</span>
                    <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 600 }}>
                      ₨ {(member.salary || 0).toLocaleString()} / month
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px' }}>📅</span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                      Joined {new Date(member.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                  <button onClick={() => openEdit(member)} style={{
                    flex: 1, padding: '8px', background: 'rgba(99,102,241,0.1)',
                    border: '0.5px solid rgba(99,102,241,0.25)', borderRadius: '8px',
                    color: '#6366F1', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    fontFamily: 'Inter,sans-serif'
                  }}>✏️ Edit</button>
                  <button onClick={() => { setSelected(member); setShowDelete(true); }} style={{
                    flex: 1, padding: '8px', background: 'rgba(239,68,68,0.08)',
                    border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                    color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                    fontFamily: 'Inter,sans-serif'
                  }}>🗑️ Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '16px', textAlign: 'right' }}>
          Showing {filtered.length} of {staffList.length} staff members
        </p>
      )}
    </div>
  );
}

export default Staff;