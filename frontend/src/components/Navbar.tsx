import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Icon from './Icon';
import '../styles/Navbar.css';
import logo from '../assets/logo.png';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  // Zavře dropdown při kliknutí mimo něj
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Načte počet nepřečtených notifikací
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const response = await api.get('/notifications/notifications/');
          const unread = response.data.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Chyba při načítání notifikací:', error);
        }
      }
    };

    fetchUnreadCount();
    // Aktualizuje počet každých 30 sekund
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Plutoa Logo" className="logo-icon" />
          <span className="logo-text">Plutoa</span>
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
        <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Přehled</Link>
        <Link to="/transactions" className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}>Transakce</Link>
        <Link to="/budgets" className={`nav-link ${location.pathname === '/budgets' ? 'active' : ''}`}>Rozpočty</Link>
        <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>Analytika</Link>
      </div>
      <div className="user-section" ref={dropdownRef}>
        {user && (
          <Link to="/notifications" className="nav-link notification-link">
            <Icon name="bell" size={20} color="currentColor" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>
        )}
        {user ? (
          <>
            <div 
              className="user-avatar" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={`${user.first_name || user.username}'s avatar`} />
              ) : (
                <div className="avatar-placeholder">
                  {(user.first_name && user.last_name) 
                    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                    : user.username.charAt(0).toUpperCase()
                  }
                </div>
              )}
            </div>
            {dropdownOpen && (
              <div className="user-dropdown">
                <div className="user-info">
                  <h4>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</h4>
                  {user.email && <p>{user.email}</p>}
                  <p>Měna: {user.currency_preference}</p>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-links">
                  <Link to="/profile" className="dropdown-link">Profil</Link>
                  <Link to="/settings" className="dropdown-link">Nastavení</Link>
                </div>
                <div className="dropdown-divider"></div>
                <button className="logout-button" onClick={handleLogout}>
                  Odhlásit se
                </button>
              </div>
            )}
          </>
        ) : (
          <Link to="/login" className="button-primary">
            Přihlásit se
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;