import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero sekce */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Vaše finanční budoucnost začíná zde</h1>
          <p>Připojte se k tisícům uživatelů, kteří využívají naši špičkovou platformu pro správu osobních financí. Bezpečně, přehledně a intuitivně.</p>
          <div className="hero-buttons">
            <Link to="/register" className="button-primary">
              Začít plánovat
            </Link>
            <Link to="/login" className="button-secondary">
              Přihlásit se
            </Link>
          </div>
        </div>
      </section>

      {/* Features sekce */}
      <section className="features-section">
        <div className="container">
          <h2>Proč si vybrat nás?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3>Chytré rozpočty</h3>
              <p>Inteligentní rozpočtování a sledování výdajů pro lepší kontrolu nad vašimi financemi.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h3>Bankovní zabezpečení</h3>
              <p>Špičkové bezpečnostní prvky pro ochranu vašich finančních dat a transakcí.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3>Automatizované přehledy</h3>
              <p>Rychlé a přesné finanční přehledy a reporty v reálném čase.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3>Cíle a úspory</h3>
              <p>Nastavte si finanční cíle a sledujte svůj pokrok k dosažení vašich snů.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats sekce */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>2.5M+</h3>
              <p>Zpracovaných transakcí</p>
            </div>
            <div className="stat-card">
              <h3>50K+</h3>
              <p>Spokojených uživatelů</p>
            </div>
            <div className="stat-card">
              <h3>99.9%</h3>
              <p>Dostupnost systému</p>
            </div>
            <div className="stat-card">
              <h3>24/7</h3>
              <p>Podpora uživatelů</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;