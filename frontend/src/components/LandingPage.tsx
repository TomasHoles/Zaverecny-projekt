/**
 * LandingPage.tsx - Úvodní stránka aplikace Plutoa
 * 
 * @author Tomáš Holes
 * @description Marketingová landing page pro nepřihlášené uživatele:
 *   - Hero sekce s animovaným Prism pozadím
 *   - Prezentace hlavních funkcí aplikace
 *   - CTA sekce pro registraci
 * 
 * @components Prism (WebGL animace pozadí)
 * @icons Lucide React
 * 
 * @performance
 *   - Lazy loading Prism komponenty
 *   - Detekce slabého hardware pro fallback
 *   - Snížená kvalita na mobilech
 */
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  PieChart,
  Target,
  Bell,
  Wallet,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import '../styles/LandingPage.css';

// Lazy load Prism komponenty - načte se až když je potřeba
const Prism = lazy(() => import('./Prism'));



const LandingPage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="landing-page">
      {/* Hero sekce s Prism pozadím */}
      <div className="hero-wrapper">
        {/* Prism Background nebo statický fallback */}
        <div className="dither-background">
          {isLoaded && (
            <Suspense fallback={null}>
              <Prism
                animationType="rotate"
                timeScale={0.5}
                height={3.5}
                baseWidth={5.5}
                scale={2.5}
                hueShift={0.46}
                colorFrequency={2.15}
                noise={0}
                glow={1}
                suspendWhenOffscreen={true}
              />
            </Suspense>
          )}
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

        {/* Scroll indikátor (šipka) */}
        <div
          className="scroll-indicator"
          onClick={scrollToContent}
          role="button"
          aria-label="Posuňte se dolů"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToContent()}
        >
          <div className="scroll-arrow">
            <span></span>
          </div>
        </div>
      </div>

      {/* Funkce aplikace */}
      <section className="features-section">
        <div className="container">
          <h2>Co Plutoa nabízí</h2>

          <div className="features-grid-new">
            {/* Feature 1 - velká karta */}
            <div className="feature-card-large">
              <div className="feature-visual">
                <div className="mock-chart">
                  <div className="chart-bar" style={{ height: '60%', background: 'linear-gradient(180deg, #ccff00 0%, #a8e600 100%)' }}></div>
                  <div className="chart-bar" style={{ height: '80%', background: 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)' }}></div>
                  <div className="chart-bar" style={{ height: '45%', background: 'linear-gradient(180deg, #ccff00 0%, #a8e600 100%)' }}></div>
                  <div className="chart-bar" style={{ height: '90%', background: 'linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)' }}></div>
                  <div className="chart-bar" style={{ height: '70%', background: 'linear-gradient(180deg, #ccff00 0%, #a8e600 100%)' }}></div>
                </div>
              </div>
              <div className="feature-content">
                <div className="feature-icon-badge">
                  <TrendingUp size={20} />
                </div>
                <h3>Sledování transakcí</h3>
                <p>
                  Zaznamenávejte všechny své příjmy a výdaje. Kategorizujte je,
                  přidávejte poznámky a mějte přehled o každé koruně.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card-medium">
              <div className="feature-icon-badge purple">
                <PieChart size={20} />
              </div>
              <h3>Rozpočty</h3>
              <p>Nastavte si měsíční limity a dostávejte upozornění při jejich překročení.</p>
              <div className="feature-mini-visual">
                <div className="mini-progress">
                  <div className="mini-progress-fill" style={{ width: '75%' }}></div>
                </div>
                <span className="mini-label">75% využito</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card-medium">
              <div className="feature-icon-badge green">
                <Target size={20} />
              </div>
              <h3>Finanční cíle</h3>
              <p>Definujte si cíle a sledujte svůj pokrok k jejich dosažení.</p>
              <div className="feature-mini-visual">
                <div className="goal-circles">
                  <div className="goal-circle active"></div>
                  <div className="goal-circle active"></div>
                  <div className="goal-circle active"></div>
                  <div className="goal-circle"></div>
                  <div className="goal-circle"></div>
                </div>
                <span className="mini-label">3 z 5 splněno</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card-small">
              <div className="feature-icon-badge orange">
                <Bell size={20} />
              </div>
              <h3>Notifikace</h3>
              <p>Upozornění na důležité události</p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card-small">
              <div className="feature-icon-badge blue">
                <Wallet size={20} />
              </div>
              <h3>Více účtů</h3>
              <p>Správa všech financí na jednom místě</p>
            </div>

            {/* Feature 6 */}
            <div className="feature-card-small">
              <div className="feature-icon-badge pink">
                <CreditCard size={20} />
              </div>
              <h3>Opakované platby</h3>
              <p>Automatické zaznamenávání</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA sekce */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Začněte spravovat své finance ještě dnes</h2>
            <p>Registrace zabere jen okamžik</p>
            <Link to="/register" className="cta-button">
              Vytvořit účet
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className="cta-decoration">
            <div className="floating-card card-1">
              <TrendingUp size={24} />
              <span>+12%</span>
            </div>
            <div className="floating-card card-2">
              <Wallet size={24} />
              <span>Úspory</span>
            </div>
            <div className="floating-card card-3">
              <Target size={24} />
              <span>Cíl splněn</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is rendered globally in App.tsx */}
    </div>
  );
};

export default LandingPage;