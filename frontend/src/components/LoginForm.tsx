import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LoginForm.css';

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Přihlášení selhalo. Zkontrolujte své údaje.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Přihlášení</h2>

        {error && (
          <div className="auth-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="username">UŽIVATELSKÉ JMÉNO</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Uživatelské jméno"
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">HESLO</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Heslo"
              className="auth-input"
            />
          </div>

          <div className="auth-remember-row">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-checkbox"
              />
              <span>Zůstat přihlášen</span>
            </label>
            <Link to="/forgot-password" className="auth-forgot-link">Zapomenuté heslo?</Link>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Přihlašuji...' : 'Přihlásit se'}
          </button>

          <div className="auth-register-link">
            Nemáte účet? <Link to="/register">Zaregistrujte se</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
