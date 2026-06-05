import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const links = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/products', icon: '📦', label: 'Products' },
  { to: '/sales', icon: '💰', label: 'Sales' },
  { to: '/udhaar', icon: '📋', label: 'Loan' },
  { to: '/staff', icon: '👥', label: 'Staff' },
  { to: '/ai-chat', icon: '🤖', label: 'AI Chat' },
];

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out!');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        🛒 ShopSmart AI
      </div>

      <nav style={{ flex: 1, marginTop: '16px' }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        🚪 Logout
      </button>
    </div>
  );
}

export default Sidebar;