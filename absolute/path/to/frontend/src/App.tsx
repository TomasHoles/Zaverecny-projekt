import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import BudgetList from './components/BudgetList';
import BudgetForm from './components/BudgetForm';
import LoginForm from './components/LoginForm';
import './App.css';

// Protected Route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            {/* Transaction Routes */}
            <Route path="transactions" element={<TransactionList />} />
            <Route path="transactions/new" element={<TransactionForm />} />
            <Route path="transactions/:id" element={<TransactionForm />} />
            
            {/* Budget Routes */}
            <Route path="budgets" element={<BudgetList />} />
            <Route path="budgets/new" element={<BudgetForm />} />
            <Route path="budgets/:id" element={<BudgetForm />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;