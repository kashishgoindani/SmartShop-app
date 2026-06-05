import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getStrength = (p) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#06B6D4', '#10b981'];
  const score = getStrength(form.password);

  const validate = () => {
    if (!form.name.trim()) { toast.error('Full name is required'); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { toast.error('Please enter a valid email address'); return false; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return false; }
    if (!/[A-Z]/.test(form.password)) { toast.error('Password needs 1 uppercase letter'); return false; }
    if (!/[0-9]/.test(form.password)) { toast.error('Password needs 1 number'); return false; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await API.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: 'admin',
      });
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-left">
          <div className="orb1" /><div className="orb2" />
          <div className="brand">
            <div className="brand-logo">
              <div className="logo-icon">🛒</div>
              <span className="logo-name">ShopSmart AI</span>
            </div>
            <h1 className="brand-headline">Start your smart<br /><span>shop journey</span></h1>
            <p className="brand-desc">Join thousands of shopkeepers already using ShopSmart AI to grow their business.</p>
          </div>
          <div className="feature-list">
            {['Free to get started','AI-powered insights','Udhaar & sales tracking','Secure & reliable'].map(f => (
              <div className="feature-item" key={f}><div className="feature-dot" /><span>{f}</span></div>
            ))}
          </div>
        </div>

        <div className="auth-right">
          <div className="tab-row">
            <Link to="/login" className="tab-btn">Login</Link>
            <button className="tab-btn active">Sign Up</button>
          </div>

          <h2 className="auth-title">Create account</h2>
          <p className="auth-sub">Start managing your shop today</p>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input className="auth-input" type="text" placeholder="Ahmed Khan"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>

            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <input
                className={`auth-input ${form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'error' : form.email ? 'success' : ''}`}
                type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                <p className="hint-text" style={{color:'#ef4444'}}>Please enter a valid email (must include @)</p>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input className="auth-input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              {form.password && (
                <>
                  <div className="strength-bar">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`strength-segment ${i <= score ? ['','weak','fair','good','strong'][score] : ''}`} />
                    ))}
                  </div>
                  <p className="strength-text" style={{color: strengthColor[score]}}>
                    {strengthLabel[score]} password
                  </p>
                </>
              )}
              <p className="hint-text">At least 8 chars · 1 uppercase · 1 number</p>
            </div>

            <div className="auth-field" style={{marginBottom: 24}}>
              <label className="auth-label">Confirm Password</label>
              <input
                className={`auth-input ${form.confirm && form.confirm !== form.password ? 'error' : form.confirm && form.confirm === form.password ? 'success' : ''}`}
                type="password" placeholder="••••••••"
                value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />
              {form.confirm && form.confirm !== form.password && (
                <p className="hint-text" style={{color:'#ef4444'}}>Passwords do not match</p>
              )}
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create my account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;