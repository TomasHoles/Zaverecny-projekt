import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Transactions from './components/Transactions'; // Nový import
import Budgets from './components/Budgets'; // Nový import
import Analytics from './components/Analytics'; // Nový import
import './styles/App.css';
import EmailVerification from './components/EmailVerification';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/verify-email/:token" element={<EmailVerification />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              {/* Nové routy */}
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              } />
              <Route path="/budgets" element={
                <ProtectedRoute>
                  <Budgets />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;