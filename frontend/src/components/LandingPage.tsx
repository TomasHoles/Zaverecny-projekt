import React from 'react';
import { Link } from 'react-router-dom';
import Prism from './Prism';
import '../styles/LandingPage.css';

const LandingPage: React.FC = () => {
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
        {/* Prism Background */}
        <div className="dither-background">
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

      {/* O aplikaci */}
      <section className="about-section">
        <div className="container">
          <h2>Co je Plutoa?</h2>
          <p className="about-intro">
            Plutoa je moderní webová aplikace pro správu osobních financí, která vám pomůže
            získat kontrolu nad vašimi penězi. Jednoduché rozhraní, výkonné nástroje a
            přehledné grafy – to vše na jednom místě.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <h3>Sledování transakcí</h3>
              <p>
                Evidujte všechny příjmy a výdaje na jednom místě. Přidávejte transakce
                rychle a jednoduše, organizujte je do kategorií a sledujte, kam vaše
                peníze skutečně odcházejí.
              </p>
            </div>

            <div className="feature-card">
              <h3>Rozpočty</h3>
              <p>
                Vytvářejte si měsíční nebo roční rozpočty pro různé kategorie výdajů.
                Aplikace vás upozorní, když se blížíte k limitu, a pomůže vám udržet
                výdaje pod kontrolou.
              </p>
            </div>

            <div className="feature-card">
              <h3>Finanční cíle</h3>
              <p>
                Stanujte si finanční cíle – ať už jde o nový telefon, dovolenou nebo
                nouzový fond. Sledujte svůj pokrok a motivujte se k dosažení svých snů.
              </p>
            </div>

            <div className="feature-card">
              <h3>Analýzy a statistiky</h3>
              <p>
                Získejte detailní přehled o svých financích pomocí grafů a statistik.
                Zjistěte, které kategorie vás nejvíce zatěžují, a identifikujte možnosti
                úspor.
              </p>
            </div>

            <div className="feature-card">
              <h3>Notifikace</h3>
              <p>
                Buďte informováni o důležitých událostech – překročení rozpočtu,
                blížící se termín cíle nebo opakující se platby. Nic vám neunikne.
              </p>
            </div>

            <div className="feature-card">
              <h3>Bezpečnost</h3>
              <p>
                Vaše data jsou v bezpečí. Používáme moderní šifrovací metody a
                bezpečnostní protokoly, abychom chránili vaše citlivé finanční informace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="how-it-works-section">
        <div className="container">
          <h2>Jak to funguje?</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Zaregistrujte se</h3>
              <p>
                Vytvoření účtu trvá jen pár sekund. Stačí email a heslo – žádné
                složité formuláře nebo ověřování platebních karet.
              </p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Přidejte své transakce</h3>
              <p>
                Začněte zaznamenávat své příjmy a výdaje. Můžete je přidávat ručně
                nebo nastavit opakující se transakce pro pravidelné platby.
              </p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Vytvořte rozpočty a cíle</h3>
              <p>
                Nastavte si měsíční rozpočty pro různé kategorie a definujte své
                finanční cíle. Aplikace vám pomůže je dodržovat.
              </p>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <h3>Sledujte a analyzujte</h3>
              <p>
                Využijte dashboard a analýzy k získání přehledu o svých financích.
                Identifikujte trendy a optimalizujte své výdaje.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proč Plutoa */}
      <section className="why-section">
        <div className="container">
          <h2>Proč zvolit Plutoa?</h2>
          <div className="why-grid">
            <div className="why-item">
              <h3>Jednoduché</h3>
              <p>Intuitivní rozhraní, které zvládne každý – bez zbytečné složitosti.</p>
            </div>
            <div className="why-item">
              <h3>Rychlé</h3>
              <p>Přidání transakce trvá jen pár sekund. Žádné zdlouhavé procesy.</p>
            </div>
            <div className="why-item">
              <h3>Zdarma</h3>
              <p>Všechny základní funkce jsou dostupné úplně zdarma. Bez skrytých poplatků.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA sekce */}
      <section className="cta-section">
        <div className="container">
          <h2>Připraveni začít?</h2>
          <p>
            Připojte se k uživatelům, kteří již mají své finance pod kontrolou.
            Registrace je zdarma a trvá jen chvilku.
          </p>
          <Link to="/register" className="button-primary large">
            Začít zdarma
          </Link>
        </div>
      </section>

      {/* Footer is rendered globally in App.tsx */}
    </div>
  );
};

export default LandingPage;