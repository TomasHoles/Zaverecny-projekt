import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Mail, Heart } from 'lucide-react';
import '../styles/Footer.css';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                {/* Top Section */}
                <div className="footer-top">
                    <div className="footer-brand">
                        <h3 className="footer-logo">Plutoa</h3>
                        <p className="footer-tagline">
                            Moderní správa osobních financí
                        </p>
                    </div>

                    <div className="footer-links-grid">
                        {/* Produkt */}
                        <div className="footer-column">
                            <h4>Produkt</h4>
                            <Link to="/overview" className="footer-link">Přehled</Link>
                            <Link to="/transactions" className="footer-link">Transakce</Link>
                            <Link to="/budgets" className="footer-link">Rozpočty</Link>
                            <Link to="/goals" className="footer-link">Cíle</Link>
                            <Link to="/analytics" className="footer-link">Analytika</Link>
                        </div>

                        {/* Podpora */}
                        <div className="footer-column">
                            <h4>Podpora</h4>
                            <a href="#" className="footer-link">Nápověda</a>
                            <a href="#" className="footer-link">FAQ</a>
                            <a href="#" className="footer-link">Kontakt</a>
                            <a href="#" className="footer-link">Zpětná vazba</a>
                        </div>

                        {/* Právní */}
                        <div className="footer-column">
                            <h4>Právní</h4>
                            <a href="#" className="footer-link">Ochrana soukromí</a>
                            <a href="#" className="footer-link">Podmínky použití</a>
                            <a href="#" className="footer-link">Cookies</a>
                        </div>

                        {/* Sociální sítě */}
                        <div className="footer-column">
                            <h4>Sledujte nás</h4>
                            <div className="social-links">
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                    <Github size={20} />
                                    <span>GitHub</span>
                                </a>
                                <a href="mailto:info@plutoa.cz" className="social-link">
                                    <Mail size={20} />
                                    <span>Email</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="footer-divider"></div>

                {/* Bottom Section */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © {currentYear} Plutoa. Všechna práva vyhrazena.
                    </p>
                    <p className="footer-made-with">
                        Vytvořeno s <Heart size={14} className="heart-icon" /> v České republice
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
