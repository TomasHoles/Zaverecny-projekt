import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LoginForm.css';

const EmailVerification: React.FC = () => {
  const { token } = useParams<{ token?: string }>();
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const result = await verifyEmail(token);
        setSuccess(true);
        setError('');
        console.log(result.message);
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        setSuccess(false);
        setError(err.response?.data?.error || 'Ověření selhalo. Zkuste to prosím znovu.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token, verifyEmail, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setResendLoading(true);
    try {
      const result = await resendVerification(email);
      setResendSuccess(true);
      setError('');
      console.log(result.message);
    } catch (err: any) {
      setResendSuccess(false);
      setError(err.response?.data?.error || 'Odeslání selhalo. Zkuste to prosím znovu.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Ověření Emailu</h2>
        
        {loading ? (
          <div className="loading-message">
            <p>Ověřování...</p>
          </div>
        ) : success ? (
          <div className="success-message">
            <p>Email byl úspěšně ověřen! Přesměrování na přihlášení...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <form onSubmit={handleResend}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <button 
                type="submit" 
                className="login-button"
                disabled={resendLoading}
              >
                {resendLoading ? 'Odesílání...' : 'Odeslat ověřovací email znovu'}
              </button>
            </form>
            {resendSuccess && (
              <div className="success-message">
                <p>Ověřovací email byl odeslán!</p>
              </div>
            )}
          </>
        )}
        <div className="register-link">
          <a href="/login">Zpět na přihlášení</a>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;