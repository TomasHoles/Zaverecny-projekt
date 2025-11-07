/**
 * Hlavní komponenta aplikace Plutoa - Osobní finanční plánovač
 * 
 * @description
 * Toto je root komponenta aplikace, která nastavuje routing a globální layout.
 * Všechny stránky sdílejí společný Navbar a Footer.
 * 
 * @structure
 * - Router: Zajišťuje navigaci mezi stránkami (React Router v6)
 * - AuthProvider: Poskytuje autentizační kontext pro celou aplikaci
 * - Navbar: Horní navigační lišta (vždy viditelná)
 * - main.main-content: Kontejner pro obsah stránek (flex: 1 pro sticky footer)
 * - Footer: Spodní patička (vždy na spodku díky flexboxu)
 * 
 * @routes
 * Veřejné routy (přístupné bez přihlášení):
 * - / : Landing page (úvodní stránka)
 * - /login : Přihlašovací formulář
 * - /register : Registrační formulář
 * - /verify-email : Email verifikace (momentálně neaktivní)
 * 
 * Chráněné routy (vyžadují přihlášení pomocí ProtectedRoute):
 * - /dashboard : Hlavní dashboard s přehledem financí
 * - /overview : Detailní přehled s grafy a statistikami
 * - /transactions : Správa transakcí (příjmy/výdaje)
 * - /budgets : Správa rozpočtů
 * - /analytics : Analytické nástroje (v přípravě)
 * - /profile : Uživatelský profil a nastavení
 * 
 * @notes
 * - Všechny chráněné routy automaticky přesměrují na /login pokud uživatel není přihlášen
 * - Layout používá flexbox (min-height: 100vh) pro sticky footer
 * - Catch-all route (*) přesměruje na homepage
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import Analytics from './components/Analytics';
import Overview from './components/Overview';
import Profile from './components/Profile';
import './styles/App.css';
import EmailVerification from './components/EmailVerification';

function App() {
  return (
    <Router>
      {/* AuthProvider obaluje celou aplikaci a poskytuje autentizační stav */}
      <AuthProvider>
        <div className="app">
          {/* Navbar - viditelný na všech stránkách */}
          <Navbar />
          
          {/* Main content - flex: 1 zajistí, že footer bude vždy na spodku */}
          <main className="main-content">
            <Routes>
              {/* === VEŘEJNÉ ROUTY === */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/verify-email/:token" element={<EmailVerification />} />
              
              {/* === CHRÁNĚNÉ ROUTY === */}
              {/* Dashboard - hlavní přehled financí */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Transakce - správa příjmů a výdajů */}
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              } />
              
              {/* Rozpočty - plánování a sledování rozpočtů */}
              <Route path="/budgets" element={
                <ProtectedRoute>
                  <Budgets />
                </ProtectedRoute>
              } />
              
              {/* Analytika - grafy a statistiky (v přípravě) */}
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              
              {/* Přehled - detailní pohled na finance */}
              <Route path="/overview" element={
                <ProtectedRoute>
                  <Overview />
                </ProtectedRoute>
              } />
              
              {/* Profil - nastavení uživatele */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route - přesměruje na homepage */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          
          {/* Footer - viditelný na všech stránkách, sticky na spodku */}
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;