/**
 * Hlavní komponenta aplikace Plutoa
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import Overview from './components/Overview';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import Analytics from './components/Analytics';
import Profile from './components/Profile';
import InstallPrompt from './components/InstallPrompt';
import Notifications from './components/Notifications';
import Goals from './components/Goals';
import EmailVerification from './components/EmailVerification';
import './styles/App.css';
import './styles/GlobalHoverEffects.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <div className="app">
              <Navbar />

              <main className="main-content">
                <Routes>
                  {/* Veřejné stránky */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={
                    <div className="page-container">
                      <LoginForm />
                    </div>
                  } />
                  <Route path="/register" element={
                    <div className="page-container">
                      <RegisterForm />
                    </div>
                  } />
                  <Route path="/forgot-password" element={
                    <div className="page-container">
                      <ForgotPassword />
                    </div>
                  } />
                  <Route path="/reset-password/:token" element={
                    <div className="page-container">
                      <ResetPassword />
                    </div>
                  } />
                  <Route path="/verify-email" element={
                    <div className="page-container">
                      <EmailVerification />
                    </div>
                  } />
                  <Route path="/verify-email/:token" element={
                    <div className="page-container">
                      <EmailVerification />
                    </div>
                  } />

                  {/* Chráněné stránky */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <div className="page-container">
                        <Dashboard />
                      </div>
                    </ProtectedRoute>
                  } />

                  <Route path="/transactions" element={
                    <ProtectedRoute>
                      <div className="page-container">
                        <Transactions />
                      </div>
                    </ProtectedRoute>
                  } />

                  <Route path="/budgets" element={
                    <ProtectedRoute>
                      <div className="page-container">
                        <Budgets />
                      </div>
                    </ProtectedRoute>
                  } />

                  <Route path="/goals" element={
                    <ProtectedRoute>
                      <div className="page-container">
                        <Goals />
                      </div>
                    </ProtectedRoute>
                  } />

                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <div className="page-container">
                        <Analytics />
                      </div>
                    </ProtectedRoute>
                  } />

                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <div className="page-container">
                        <Profile />
                      </div>
                    </ProtectedRoute>
                  } />

                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <div className="page-container">
                        <Notifications />
                      </div>
                    </ProtectedRoute>
                  } />

                  {/* Přesměrování */}
                  <Route path="/overview" element={
                    <ProtectedRoute>
                      <Overview />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>

              <InstallPrompt />
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;