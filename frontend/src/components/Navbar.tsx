import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Navbar.css';
import logo from '../assets/logo.png';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Plutoa Logo" className="logo-icon" />
          <span className="logo-text">Plutoa</span>
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/overview" className="nav-link">Přehled</Link>
        <Link to="/transactions" className="nav-link">Transakce</Link>
        <Link to="/budgets" className="nav-link">Rozpočty</Link>
        <Link to="/analytics" className="nav-link">Analytika</Link>
      </div>
      <div className="user-section" ref={dropdownRef}>
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