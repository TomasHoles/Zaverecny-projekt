import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LoginForm.css';

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Hesla se neshodují');
      return;
    }

    setLoading(true);

    try {
      await register({
        username,
        email,
        password,
        password2: confirmPassword,
        first_name: '',
        last_name: '',
        currency_preference: 'CZK'
      });
      
      navigate('/overview');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
        } else {
          setError('Registrace selhala. Zkuste to znovu.');
        }
      } else {
        setError('Registrace selhala. Zkuste to znovu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Registrace</h2>

        {error && (
          <div className="auth-error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="auth-form">
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
            <label htmlFor="email">EMAIL</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Váš email"
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

          <div className="auth-form-group">
            <label htmlFor="confirm-password">POTVRZENÍ HESLA</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Potvrďte heslo"
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Vytvářím účet...' : 'Registrovat se'}
          </button>

          <div className="auth-register-link">
            Už máte účet? <Link to="/login">Přihlásit se</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
