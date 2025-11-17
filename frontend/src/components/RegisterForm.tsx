import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';
import '../styles/LoginForm.css';

// Interface pro chybové stavy formuláře
interface ErrorState {
  username?: string;
  password?: string;
  password2?: string;
  first_name?: string;
  last_name?: string;
  general?: string;
}

/**
 * RegisterForm komponenta - formulář pro registraci nového uživatele
 * Umožňuje registraci pouze s username a heslem (bez emailu)
 */
const RegisterForm: React.FC = () => {
  // Stav formuláře - data zadaná uživatelem
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: ''
  });
  
  // Stav pro chybové zprávy
  const [errors, setErrors] = useState<ErrorState>({});
  
  // Loading stav během odesílání formuláře
  const [loading, setLoading] = useState(false);
  
  // Stavy pro zobrazení/skrytí hesel
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Zpráva o úspěšné registraci
  const [successMessage, setSuccessMessage] = useState('');
  
  // React Router hook pro navigaci
  const navigate = useNavigate();
  
  // AuthContext hook pro registrační funkci
  const { register } = useAuth();

  // Funkce pro kontrolu síly hesla
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 1) return { strength: 1, label: 'Slabé', color: '#EF4444' };
    if (strength <= 3) return { strength: 2, label: 'Střední', color: '#F59E0B' };
    return { strength: 3, label: 'Silné', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Handler pro změnu hodnot ve formuláři
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Vymaže chybu když uživatel začne psát
    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Validace formuláře před odesláním
  const validateForm = () => {
    const newErrors: ErrorState = {};
    let isValid = true;
    
    // Validace username - povinné pole
    if (!formData.username) {
      newErrors.username = 'Uživatelské jméno je povinné';
      isValid = false;
    }
    
    // Validace hesla - povinné pole, minimálně 8 znaků
    if (!formData.password) {
      newErrors.password = 'Heslo je povinné';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Heslo musí mít alespoň 8 znaků';
      isValid = false;
    }
    
    // Validace potvrzení hesla - musí se shodovat s heslem
    if (!formData.password2) {
      newErrors.password2 = 'Potvrzení hesla je povinné';
      isValid = false;
    } else if (formData.password !== formData.password2) {
      newErrors.password2 = 'Hesla se neshodují';
      isValid = false;
    }
    
    // Jméno a příjmení jsou volitelné, takže nevalidujeme
    
    setErrors(newErrors);
    return isValid;
  };

  // Handler pro odeslání formuláře
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();  // Zabráníme výchozímu odeslání formuláře
    
    // Nejdříve validujeme formulář
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);  // Nastavíme loading stav
    
    try {
      // Zavoláme registrační funkci z AuthContext
      const result = await register({
        username: formData.username,
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name,
        last_name: formData.last_name
      });
      
      setSuccessMessage(result.message);
      // Přesměrování na úvodní stránku po úspěšné registraci
      setTimeout(() => {
        navigate('/');
      }, 4000);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      const responseData = err.response?.data;
      
      // Zpracování strukturovaných validačních chyb z API
      if (typeof responseData === 'object' && responseData !== null) {
        const newErrors: ErrorState = {};
        
        // Kontrola speciálních chyb hesla
        if (responseData.error && responseData.details) {
          // Chyba validace hesla s detaily
          newErrors.password = responseData.error;
          newErrors.general = responseData.details.join(' ');
        } else {
          Object.entries(responseData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              newErrors[key as keyof ErrorState] = value[0] as string;
            } else if (typeof value === 'string') {
              newErrors[key as keyof ErrorState] = value;
            }
          });
        }
        
        if (Object.keys(newErrors).length === 0) {
          newErrors.general = 'Registrace selhala. Zkuste to prosím znovu.';
        }
        
        setErrors(newErrors);
      } else {
        // Zpracování obecných chyb
        setErrors({
          general: err.response?.data?.message || err.message || 'Registrace selhala. Zkuste to prosím znovu.'
        });
      }
    } finally {
      setLoading(false);  // Vypneme loading stav
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Vytvořit účet</h2>
        
        {/* Zobrazení zprávy o úspěšné registraci */}
        {successMessage && (
          <div className="success-message-box">
            <div className="success-icon-wrapper">
              <svg className="success-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="success-content">
              <h3>Registrace úspěšná!</h3>
              <p>{successMessage}</p>
              <p className="redirect-info">Za chvíli budete přesměrováni na přihlašovací stránku...</p>
            </div>
          </div>
        )}
        
        {/* Zobrazení obecných chyb */}
        {errors.general && (
          <div className="error-message">
            {errors.general}
          </div>
        )}
        
        {/* Registrační formulář */}
        <form onSubmit={handleSubmit}>
          {/* Pole pro uživatelské jméno - povinné */}
          <div className="form-group">
            <label htmlFor="username">Uživatelské jméno *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              disabled={loading}
              placeholder="Zadejte uživatelské jméno"
            />
            {errors.username && <div className="field-error">{errors.username}</div>}
          </div>
          
          {/* Pole pro jméno - volitelné */}
          <div className="form-group">
            <label htmlFor="first_name">Jméno (volitelné)</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={errors.first_name ? 'error' : ''}
              disabled={loading}
              placeholder="Zadejte jméno"
            />
            {errors.first_name && <div className="field-error">{errors.first_name}</div>}
          </div>
          
          {/* Pole pro příjmení - volitelné */}
          <div className="form-group">
            <label htmlFor="last_name">Příjmení (volitelné)</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={errors.last_name ? 'error' : ''}
              disabled={loading}
              placeholder="Zadejte příjmení"
            />
            {errors.last_name && <div className="field-error">{errors.last_name}</div>}
          </div>
          
          {/* Pole pro heslo - povinné s možností zobrazení/skrytí */}
          <div className="form-group password-group">
            <label htmlFor="password">Heslo *</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                disabled={loading}
                placeholder="Zadejte heslo (min. 8 znaků)"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} />
              </button>
            </div>
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill"
                    style={{ 
                      width: `${(passwordStrength.strength / 3) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  ></div>
                </div>
                <span className="strength-label" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
            <div className="password-requirements">
              <small>• Minimálně 8 znaků</small>
              <small>• Kombinace velkých a malých písmen</small>
              <small>• Alespoň jedno číslo</small>
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
          
          {/* Pole pro potvrzení hesla - povinné s možností zobrazení/skrytí */}
          <div className="form-group password-group">
            <label htmlFor="password2">Potvrzení hesla *</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className={errors.password2 ? 'error' : ''}
                disabled={loading}
                placeholder="Potvrďte heslo"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? 'Skrýt' : 'Zobrazit'}
              </button>
            </div>
            {errors.password2 && <div className="field-error">{errors.password2}</div>}
          </div>
          
          {/* Tlačítko pro odeslání formuláře */}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Registrace...' : 'Registrovat se'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;