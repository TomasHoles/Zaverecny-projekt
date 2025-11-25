import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';
import { Bell, Trash2, Plus, Clock, LogOut, User, Settings } from 'lucide-react';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [generatingData, setGeneratingData] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleGenerateDemoData = async () => {
    if (!user) return;

    try {
      setGeneratingData(true);
      const response = await api.post('/transactions/generate-demo-data/');
      toast.success(response.data.message || 'Demo data byla úspěšně vytvořena! (včetně opakujících se transakcí)');

      // Refresh stránky po 2 sekundách, aby backend stihl vytvořit všechna data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nepodařilo se vytvořit demo data');
      setGeneratingData(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;

    if (!window.confirm('Opravdu chcete smazat VŠECHNA data? Tato akce je nevratná!')) {
      return;
    }

    try {
      setGeneratingData(true);
      const response = await api.post('/transactions/delete-all-data/');
      toast.success(response.data.message || 'Všechna data byla smazána!');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Nepodařilo se smazat data');
      setGeneratingData(false);
    }
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
          // Tiché selhání - notifikace nejsou kritické
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
          <img src="/logo.png" alt="Plutoa Logo" className="logo-icon" />
          <span className="logo-text">Plutoa</span>
        </Link>
      </div>

      {/* Hamburger menu button */}
      <button
        className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={closeMobileMenu}>Home</Link>
        <Link to="/overview" className={`nav-link ${location.pathname === '/overview' ? 'active' : ''}`} onClick={closeMobileMenu}>Přehled</Link>
        <Link to="/transactions" className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`} onClick={closeMobileMenu}>Transakce</Link>
        <Link to="/budgets" className={`nav-link ${location.pathname === '/budgets' ? 'active' : ''}`} onClick={closeMobileMenu}>Rozpočty</Link>
        <Link to="/goals" className={`nav-link ${location.pathname === '/goals' ? 'active' : ''}`} onClick={closeMobileMenu}>Cíle</Link>
        <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`} onClick={closeMobileMenu}>Analytika</Link>

        {/* Mobile user actions */}
        {user && (
          <div className="mobile-user-actions">
            <Link to="/notifications" className="nav-link notification-link-mobile" onClick={closeMobileMenu}>
              <Bell size={20} color="currentColor" />
              <span>Notifikace</span>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </Link>
            <Link to="/profile" className="nav-link" onClick={closeMobileMenu}>Profil</Link>
            <button className="nav-link logout-button-mobile" onClick={handleLogout}>
              Odhlásit se
            </button>
          </div>
        )}
      </div>

      <div className="user-section" ref={dropdownRef}>
        {/* Delete All Data Button */}
        {user && (
          <button
            className="delete-data-button"
            onClick={handleDeleteAllData}
            disabled={generatingData}
            title="Smazat všechna data"
          >
            <Trash2 size={18} color="#ffffff" />
          </button>
        )}

        {/* Generate Demo Data Button */}
        {user && (
          <button
            className="demo-data-button"
            onClick={handleGenerateDemoData}
            disabled={generatingData}
            title="Vygenerovat demo data"
          >
            {generatingData ? (
              <Clock size={18} color="#ffffff" />
            ) : (
              <Plus size={18} color="#ffffff" />
            )}
          </button>
        )}

        {user && (
          <Link to="/notifications" className="nav-link notification-link">
            <Bell size={20} color="currentColor" />
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
                  <Link to="/profile" className="dropdown-link">
                    <User size={16} /> Profil
                  </Link>
                  <Link to="/settings" className="dropdown-link">
                    <Settings size={16} /> Nastavení
                  </Link>
                </div>
                <div className="dropdown-divider"></div>
                <button className="logout-button" onClick={handleLogout}>
                  <LogOut size={16} /> Odhlásit se
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