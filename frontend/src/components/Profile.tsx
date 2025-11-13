import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../styles/Profile.css';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  currency_preference: string;
}

interface PasswordData {
  old_password: string;
  new_password: string;
  new_password2: string;
}

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState<ProfileData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    currency_preference: user?.currency_preference || 'CZK'
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    old_password: '',
    new_password: '',
    new_password2: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Vymaže zprávy při změně
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await api.patch('/accounts/users/update_profile/', formData);
      setUser(response.data);
      setSuccessMessage('Profil byl úspěšně aktualizován!');
      setIsEditing(false);
      
      // Automaticky skrýt zprávu po 3 sekundách
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setErrorMessage(err.response?.data?.message || 'Nepodařilo se aktualizovat profil. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      currency_preference: user?.currency_preference || 'CZK'
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      await api.post('/accounts/users/change_password/', passwordData);
      setSuccessMessage('Heslo bylo úspěšně změněno!');
      setIsChangingPassword(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password2: ''
      });
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setErrorMessage(err.response?.data?.error || 'Nepodařilo se změnit heslo. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validace typu souboru
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Můžete nahrát pouze obrázky.');
      return;
    }

    // Validace velikosti (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Soubor je příliš velký. Maximální velikost je 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await api.post('/accounts/users/upload_avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Avatar upload response:', response.data);
      
      // Aktualizujeme uživatele s novým avatarem
      if (user && response.data.avatar) {
        setUser({
          ...user,
          avatar: response.data.avatar
        });
        
        // Aktualizujeme také localStorage pro persistenci
        const token = localStorage.getItem('token');
        if (token) {
          // Načteme aktualizovaná data uživatele
          const userResponse = await api.get('/accounts/users/me/');
          setUser(userResponse.data);
        }
      }
      
      setSuccessMessage('Avatar byl úspěšně nahrán!');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      console.error('Error response:', err.response?.data);
      setErrorMessage(err.response?.data?.error || 'Nepodařilo se nahrát avatar. Zkuste to prosím znovu.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <p>Načítání profilu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user.avatar ? (
              <img src={user.avatar} alt={`${user.first_name || user.username}'s avatar`} />
            ) : (
              <div className="avatar-placeholder-large">
                {(user.first_name && user.last_name) 
                  ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                  : user.username.charAt(0).toUpperCase()
                }
              </div>
            )}
            <label htmlFor="avatar-upload" className="avatar-upload-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {uploadingAvatar ? 'Nahrávání...' : 'Změnit'}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
              disabled={uploadingAvatar}
            />
          </div>
          <div className="profile-header-info">
            <h1>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</h1>
            <p className="profile-username">@{user.username}</p>
            <p className="profile-joined">Členem od {new Date(user.date_joined).toLocaleDateString('cs-CZ')}</p>
          </div>
        </div>

        {successMessage && (
          <div className="profile-success-message">
            <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="profile-error-message">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMessage}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Osobní informace</h2>
            {!isEditing && (
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Upravit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">Jméno</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte jméno"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Příjmení</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Zadejte příjmení"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Zadejte email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="currency_preference">Preferovaná měna</label>
                <select
                  id="currency_preference"
                  name="currency_preference"
                  value={formData.currency_preference}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="CZK">CZK - Koruna česká</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dolar americký</option>
                  <option value="GBP">GBP - Libra šterlinků</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={handleCancel} disabled={loading}>
                  Zrušit
                </button>
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Ukládání...' : 'Uložit změny'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <div className="info-item">
                  <label>Jméno</label>
                  <p>{user.first_name || '—'}</p>
                </div>
                <div className="info-item">
                  <label>Příjmení</label>
                  <p>{user.last_name || '—'}</p>
                </div>
              </div>

              <div className="info-item">
                <label>Uživatelské jméno</label>
                <p>{user.username}</p>
              </div>

              <div className="info-item">
                <label>Email</label>
                <p>{user.email || '—'}</p>
              </div>

              <div className="info-item">
                <label>Preferovaná měna</label>
                <p>{user.currency_preference}</p>
              </div>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Zabezpečení</h2>
            {!isChangingPassword && (
              <button className="edit-button" onClick={() => setIsChangingPassword(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Změnit heslo
              </button>
            )}
          </div>

          {isChangingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="old_password">Staré heslo</label>
                <input
                  type="password"
                  id="old_password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  required
                  placeholder="Zadejte staré heslo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password">Nové heslo</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  required
                  placeholder="Zadejte nové heslo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password2">Potvrdit nové heslo</label>
                <input
                  type="password"
                  id="new_password2"
                  name="new_password2"
                  value={passwordData.new_password2}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  required
                  placeholder="Zadejte nové heslo znovu"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ old_password: '', new_password: '', new_password2: '' });
                    setErrorMessage('');
                    setSuccessMessage('');
                  }} 
                  disabled={loading}
                >
                  Zrušit
                </button>
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'Měním heslo...' : 'Změnit heslo'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <label>Heslo</label>
                <p>••••••••</p>
              </div>
              <div className="security-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Doporučujeme pravidelně měnit heslo pro zajištění bezpečnosti vašeho účtu.</p>
              </div>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Statistiky účtu</h2>
          </div>
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-content">
                <label>Účet aktivní</label>
                <p>{user.is_active ? 'Ano' : 'Ne'}</p>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="stat-content">
                <label>Datum registrace</label>
                <p>{new Date(user.date_joined).toLocaleDateString('cs-CZ', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
