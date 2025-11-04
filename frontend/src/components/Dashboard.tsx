import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { 
  DashboardStats, 
  BudgetOverview, 
  AnalyticsData, 
  Transaction,
  Budget 
} from '../services/dashboardService';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetOverview | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Načíst všechna data paralelně
        const [stats, budgets, analytics] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getBudgetOverview(),
          dashboardService.getAnalytics('6m')
        ]);

        setDashboardData(stats);
        setBudgetData(budgets);
        setAnalyticsData(analytics);
      } catch (err) {
        // Místo chyby nastavíme prázdná data
        console.log('Zatím nemáte žádná data, začněte přidáním transakcí');
        setDashboardData({
          total_income: 0,
          total_expenses: 0,
          balance: 0,
          recent_transactions: []
        });
        setBudgetData({
          budgets: [],
          total_budget: 0,
          total_spent: 0,
          total_remaining: 0,
          overall_percentage: 0
        });
        setAnalyticsData({
          total_income: 0,
          total_expenses: 0,
          total_savings: 0,
          category_data: [],
          monthly_data: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome Section */}
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-content">
          <h1 className="dashboard-title">Vítejte, {user?.first_name || user?.username}!</h1>
          <p className="dashboard-subtitle">Toto je váš přehled financí</p>
        </div>
      </section>

      {/* Hlavní statistiky */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <h3 className="stat-label">Celkové příjmy</h3>
          <p className="stat-value" style={{ color: '#4ADE80' }}>
            {formatCurrency(dashboardData?.total_income || 0)}
          </p>
        </div>
        
        <div className="dashboard-stat-card">
          <h3 className="stat-label">Celkové výdaje</h3>
          <p className="stat-value" style={{ color: '#FF4742' }}>
            {formatCurrency(dashboardData?.total_expenses || 0)}
          </p>
        </div>
        
        <div className="dashboard-stat-card">
          <h3 className="stat-label">Zůstatek</h3>
          <p className="stat-value" style={{ 
            color: (dashboardData?.balance || 0) >= 0 ? '#4ADE80' : '#FF4742'
          }}>
            {formatCurrency(dashboardData?.balance || 0)}
          </p>
        </div>
      </div>
      
      <div className="dashboard-content-grid">
        {/* Poslední transakce */}
        <div className="dashboard-section-card">
          <h3 className="section-header">Poslední transakce</h3>
          {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
            <div className="transaction-list">
              {dashboardData.recent_transactions.map((transaction: Transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-header">
                    <div>
                      <p className="transaction-category">
                        {transaction.category?.name || 'Bez kategorie'}
                      </p>
                      <p className="transaction-date">{formatDate(transaction.date)}</p>
                    </div>
                    <p className={`transaction-amount ${
                      transaction.type === 'INCOME' ? 'income' : 'expense'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">Zatím žádné transakce</p>
            </div>
          )}
        </div>
        
        {/* Přehled rozpočtů */}
        <div className="dashboard-section-card">
          <h3 className="section-header">Přehled rozpočtů</h3>
          {budgetData?.budgets && budgetData.budgets.length > 0 ? (
            <div>
              {budgetData.budgets.slice(0, 3).map((budget: Budget) => (
                <div key={budget.id} className="budget-summary-card">
                  <div className="budget-summary-header">
                    <p className="budget-name">{budget.name}</p>
                    <p className="budget-percentage" style={{
                      color: budget.percentage_used > 90 ? '#FF4742' :
                             budget.percentage_used > 70 ? '#FFA500' : '#4ADE80'
                    }}>
                      {budget.percentage_used.toFixed(0)}%
                    </p>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className={`progress-bar-fill ${
                        budget.percentage_used > 90 ? 'danger' : 
                        budget.percentage_used > 70 ? 'warning' : ''
                      }`}
                      style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                    ></div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </p>
                </div>
              ))}
              {budgetData.budgets.length > 3 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  a {budgetData.budgets.length - 3} dalších...
                </p>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">Zatím žádné rozpočty</p>
            </div>
          )}
        </div>
        
        {/* Analytika výdajů */}
        <div className="dashboard-section-card">
          <h3 className="section-header">Analytika výdajů</h3>
          {analyticsData?.category_data && analyticsData.category_data.length > 0 ? (
            <div className="transaction-list">
              {analyticsData.category_data.slice(0, 5).map((category, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-header">
                    <p className="transaction-category">{category.category__name}</p>
                    <p className="transaction-amount expense">{formatCurrency(category.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">Zatím žádná analytická data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;