import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/LoginForm.css';

const ForgotPassword: React.FC = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/accounts/password-reset/request/', { username });
      setSuccess(true);
      setResetToken(response.data.token); // Only for development
      
      // In production, this would redirect to email sent confirmation
      setTimeout(() => {
        navigate(`/reset-password/${response.data.token}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to request password reset. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Password Reset Requested</h2>
          <div className="success-message-box">
            <div className="success-content">
              <p>Password reset link has been generated.</p>
              <p className="redirect-info">Redirecting to reset page...</p>
            </div>
          </div>
          <div className="register-link">
            <a href="/login">Back to Login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Forgot Password</h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Enter your username to receive a password reset link.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="register-link">
          Remember your password? <a href="/login">Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
