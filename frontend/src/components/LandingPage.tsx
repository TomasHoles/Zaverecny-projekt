import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero sekce */}
      <section className="hero-section">
        <div className="hero-content">
                    <h1>Plutoa</h1>

          <p className="hero-tagline">Konečně mějte své peníze pod kontrolou</p>
          <p className="hero-description">
            Zapomeňte na složité tabulky a zmatené účtenky. 
            S Plutoa víte vždy, kam peníze jdou a kolik vám jich zbývá.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="button-primary">
              Příhlasit se
            </Link>
            <Link to="/login" className="button-secondary">
              Registrace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;