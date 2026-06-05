import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return toast.error('Please enter a valid email');
    if (form.password.length < 8) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      login(data.user, data.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotStep1 = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail) return toast.error('Enter Email ');
    if (!emailRegex.test(forgotEmail)) return toast.error('Please Enter Valid Email');
    setForgotLoading(true);
    try {
      await API.post('/auth/forgot-password', { email: forgotEmail });
      toast.success('Email verified! Set new Password');
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'This EMail is not Registered');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotStep2 = async () => {
    if (newPassword.length < 8) return toast.error('Password must be atleast 8 characters');
    if (!/[A-Z]/.test(newPassword)) return toast.error('1 uppercase letter needed');
    if (!/[0-9]/.test(newPassword)) return toast.error('1 number needed');
    if (newPassword !== confirmNew) return toast.error('Passwords do not match');
    setForgotLoading(true);
    try {
      await API.post('/auth/reset-password-direct', { email: forgotEmail, newPassword });
      toast.success('Password reset Successfully ! Login Now');
      closeForgot();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password did not reset Try Again');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotStep(1);
    setForgotEmail('');
    setNewPassword('');
    setConfirmNew('');
  };

  return (
    <div className="auth-page">
      {showForgot && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{
            background: '#1E293B', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '20px', padding: '36px', width: '100%',
            maxWidth: '440px', margin: '0 16px', display: 'flex',
            flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: 700, margin: 0 }}>
                  {forgotStep === 1 ? '🔍 Account Verify Karo' : '🔒 Naya Password Set Karo'}
                </h3>
                <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>
                  {forgotStep === 1 ? 'Apna registered email daalo' : `Email: ${forgotEmail}`}
                </p>
              </div>
              <button onClick={closeForgot} style={{
                background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                width: '32px', height: '32px', fontSize: '16px', flexShrink: 0
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  flex: 1, height: '3px', borderRadius: '2px',
                  background: s <= forgotStep ? 'linear-gradient(90deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.1)'
                }} />
              ))}
            </div>

            {forgotStep === 1 ? (
              <>
                <div className="auth-field" style={{ margin: 0 }}>
                  <label className="auth-label">Email Address</label>
                  <input className="auth-input" type="email" placeholder="you@example.com"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleForgotStep1()} autoFocus />
                </div>
                <button className="auth-btn" onClick={handleForgotStep1} disabled={forgotLoading}>
                  {forgotLoading ? 'verification is in process.....' : 'Please verify Email Address→'}
                </button>
              </>
            ) : (
              <>
                <div className="auth-field" style={{ margin: 0 }}>
                  <label className="auth-label">Naya Password</label>
                  <input className="auth-input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
                </div>
                <div className="auth-field" style={{ margin: 0 }}>
                  <label className="auth-label">Please Enter Confirm</label>
                  <input
                    className={`auth-input ${confirmNew && confirmNew !== newPassword ? 'error' : confirmNew && confirmNew === newPassword ? 'success' : ''}`}
                    type="password" placeholder="••••••••"
                    value={confirmNew} onChange={e => setConfirmNew(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleForgotStep2()} />
                  {confirmNew && confirmNew !== newPassword && (
                    <p className="hint-text" style={{ color: '#ef4444' }}>Password do not match</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setForgotStep(1)} style={{
                    flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)',
                    border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                    color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px',
                    fontFamily: 'Inter, sans-serif'
                  }}>← Wapas</button>
                  <button className="auth-btn" style={{ flex: 2 }} onClick={handleForgotStep2} disabled={forgotLoading}>
                    {forgotLoading ? 'Reset ho raha hai...' : 'Password Reset Karo 🎉'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="auth-wrap">
        <div className="auth-left">
          <div className="orb1" /><div className="orb2" />
          <div className="brand">
            <div className="brand-logo">
              <div className="logo-icon">🛒</div>
              <span className="logo-name">ShopSmart AI</span>
            </div>
            <h1 className="brand-headline">Manage your shop<br />with <span>AI power</span></h1>
            <p className="brand-desc">The smartest way to run your shop — sales, Loan, staff, and AI insights in one place.</p>
          </div>
          <div className="feature-list">
            {['Real-time sales & inventory tracking','Udhaar management with reminders','AI chat assistant English','Staff management & access control'].map(f => (
              <div className="feature-item" key={f}><div className="feature-dot" /><span>{f}</span></div>
            ))}
          </div>
        </div>
        <div className="auth-right">
          <div className="tab-row">
            <button className="tab-btn active">Login</button>
            <Link to="/register" className="tab-btn">Sign Up</Link>
          </div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-sub">Sign in to your ShopSmart account</p>
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <input
                className={`auth-input ${form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'error' : form.email ? 'success' : ''}`}
                type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                <p className="hint-text" style={{color:'#ef4444'}}>Please enter a valid email</p>
              )}
            </div>
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input className="auth-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <div className="auth-row">
              <label className="remember-label">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                Remember me
              </label>
              <span className="forgot-link" onClick={() => setShowForgot(true)} style={{cursor:'pointer'}}>
                Forgot password?
              </span>
            </div>
            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to ShopSmart'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;