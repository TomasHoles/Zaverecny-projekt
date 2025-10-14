import React from 'react';
import { useAuth } from '../contexts/AuthContext';
// Remove CSS import
// import '../styles/Dashboard.css'; (removed)

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-bg-primary min-h-screen p-8 text-text-primary">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-accent-primary">Welcome, {user?.first_name}!</h1>
        <p className="text-text-secondary text-lg">This is your Nexus Finances dashboard.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Recent Transactions</h3>
          <p className="text-text-secondary">Your recent transaction data will appear here.</p>
        </div>
        
        <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Budget Overview</h3>
          <p className="text-text-secondary">Your budget overview will appear here.</p>
        </div>
        
        <div className="bg-bg-secondary p-6 rounded-lg shadow-md border border-bg-tertiary">
          <h3 className="text-xl font-semibold mb-4 text-text-primary">Spending Analytics</h3>
          <p className="text-text-secondary">Your spending analytics will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;