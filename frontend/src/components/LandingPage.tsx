import React from 'react';
import { Link } from 'react-router-dom';
import Prism from './Prism';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Prism Background */}
      <div className="dither-background">
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0.46}
          colorFrequency={2.15}
          noise={0}
          glow={1}
        />
      </div>

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
              Registrace
            </Link>
            <Link to="/login" className="button-secondary">
              Přihlásit se
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;