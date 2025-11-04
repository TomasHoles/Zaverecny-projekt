import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { 
  DashboardStats, 
  BudgetOverview, 
  AnalyticsData, 
  Transaction,
  Budget 
} from '../services/dashboardService';
import '../styles/Overview.css';

const Overview: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetOverview | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Načíst všechna data paralelně
        const [stats, budgets, analytics] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getBudgetOverview(),
          dashboardService.getAnalytics('12m') // Delší období pro přehled
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

    fetchOverviewData();
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

  const calculateSavingsRate = () => {
    if (!dashboardData || dashboardData.total_income === 0) return 0;
    return ((dashboardData.balance / dashboardData.total_income) * 100);
  };

  if (loading) {
    return (
      <div className="overview-page">
        <div className="overview-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-page">
        <div className="overview-error">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-page">
      {/* Hero Header */}
      <section className="overview-hero">
        <div className="overview-hero-content">
          <h1 className="overview-title">Finanční přehled</h1>
          <p className="overview-subtitle">Kompletní pohled na vaše finance za posledních 12 měsíců</p>
        </div>
      </section>

      {/* Hlavní metriky */}
      <div className="overview-metrics-grid">
        <div className="overview-metric-card">
          <h3 className="metric-label">Celkové příjmy</h3>
          <p className="metric-value" style={{ color: '#4ADE80' }}>
            {formatCurrency(dashboardData?.total_income || 0)}
          </p>
          <p className="metric-description">za posledních 12 měsíců</p>
        </div>
        
        <div className="overview-metric-card">
          <h3 className="metric-label">Celkové výdaje</h3>
          <p className="metric-value" style={{ color: '#FF4742' }}>
            {formatCurrency(dashboardData?.total_expenses || 0)}
          </p>
          <p className="metric-description">za posledních 12 měsíců</p>
        </div>
        
        <div className="overview-metric-card">
          <h3 className="metric-label">Čistý zůstatek</h3>
          <p className="metric-value" style={{ 
            color: (dashboardData?.balance || 0) >= 0 ? '#4ADE80' : '#FF4742'
          }}>
            {formatCurrency(dashboardData?.balance || 0)}
          </p>
          <p className="metric-description">aktuální stav</p>
        </div>

        <div className="overview-metric-card">
          <h3 className="metric-label">Míra úspor</h3>
          <p className="metric-value" style={{ 
            color: calculateSavingsRate() >= 20 ? '#4ADE80' : 
                   calculateSavingsRate() >= 10 ? '#FFA500' : '#FF4742'
          }}>
            {calculateSavingsRate().toFixed(1)}%
          </p>
          <p className="metric-description">z celkových příjmů</p>
        </div>
      </div>

      <div className="overview-content-grid">
        {/* Detailní rozpočty */}
        <div className="overview-section-card">
          <h3 className="section-header">Stav rozpočtů</h3>
          {budgetData?.budgets && budgetData.budgets.length > 0 ? (
            <div>
              {budgetData.budgets.map((budget: Budget) => (
                <div key={budget.id} className="budget-item">
                  <div className="budget-header">
                    <div>
                      <p className="budget-name">{budget.name}</p>
                      <p className="budget-amount">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </p>
                    </div>
                    <div className="budget-stats">
                      <p className="budget-percentage" style={{
                        color: budget.percentage_used > 100 ? '#FF4742' :
                               budget.percentage_used > 80 ? '#FFA500' : '#4ADE80'
                      }}>
                        {budget.percentage_used.toFixed(0)}%
                      </p>
                      <p className="budget-remaining">
                        zbývá {formatCurrency(budget.remaining)}
                      </p>
                    </div>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className={`progress-bar-fill ${
                        budget.percentage_used > 100 ? 'danger' :
                        budget.percentage_used > 80 ? 'warning' : ''
                      }`}
                      style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="budget-summary">
                <div className="summary-row">
                  <p className="summary-label">Celkem rozpočtů:</p>
                  <p className="summary-value">
                    {formatCurrency(budgetData.total_budget)}
                  </p>
                </div>
                <div className="summary-row">
                  <p className="summary-sublabel">Celkem utraceno:</p>
                  <p className="summary-subvalue">
                    {formatCurrency(budgetData.total_spent)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">Zatím žádné rozpočty</p>
            </div>
          )}
        </div>

        {/* Top kategorie výdajů */}
        <div className="overview-section-card">
          <h3 className="section-header">Top kategorie výdajů</h3>
          {analyticsData?.category_data && analyticsData.category_data.length > 0 ? (
            <div>
              {analyticsData.category_data.map((category, index) => {
                const percentage = dashboardData?.total_expenses ? 
                  (category.total / dashboardData.total_expenses * 100) : 0;
                
                return (
                  <div key={index} className="category-item">
                    <div className="category-header">
                      <p className="category-name">{category.category__name}</p>
                      <div>
                        <span className="category-amount">{formatCurrency(category.total)}</span>
                        <span className="category-percentage">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">Zatím žádná data o kategoriích</p>
            </div>
          )}
        </div>
      </div>

      {/* Poslední transakce - rozšířený pohled */}
      <div className="overview-transactions-section">
        <div className="overview-section-card">
          <h3 className="section-header">Poslední transakce</h3>
          {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
            <div className="transactions-grid">
              {dashboardData.recent_transactions.map((transaction: Transaction) => (
                <div key={transaction.id} className="transaction-card">
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
                  {transaction.description && (
                    <p className="transaction-description">
                      {transaction.description}
                    </p>
                  )}
                  <span className={`transaction-badge ${
                    transaction.type === 'INCOME' ? 'income' : 'expense'
                  }`}>
                    {transaction.type === 'INCOME' ? 'Příjem' : 'Výdaj'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">Zatím žádné transakce</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;