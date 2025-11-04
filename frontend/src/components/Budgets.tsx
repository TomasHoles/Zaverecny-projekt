import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { BudgetOverview, Budget } from '../services/dashboardService';
import '../styles/Budgets.css';

const Budgets: React.FC = () => {
  const { user } = useAuth();
  const [budgetData, setBudgetData] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getBudgetOverview();
        setBudgetData(data);
      } catch (err) {
        console.error('Chyba při načítání rozpočtů:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK'
    }).format(amount);
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Překročeno';
    if (percentage >= 80) return 'Pozor';
    return 'V pořádku';
  };

  if (loading) {
    return (
      <div className="budgets-page">
        <div className="budgets-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="budgets-page">
      {/* Hero Section */}
      <section className="budgets-hero">
        <div className="budgets-hero-content">
          <h1 className="budgets-title">Rozpočty</h1>
          <p className="budgets-subtitle">Správa a sledování vašich rozpočtů</p>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="budgets-summary">
        <div className="summary-card">
          <h3 className="summary-label">Celkový rozpočet</h3>
          <p className="summary-value" style={{ color: 'var(--accent-primary)' }}>
            {formatCurrency(budgetData?.total_budget || 0)}
          </p>
          <p className="summary-description">Součet všech rozpočtů</p>
        </div>

        <div className="summary-card">
          <h3 className="summary-label">Celkem utraceno</h3>
          <p className="summary-value" style={{ color: '#FF4742' }}>
            {formatCurrency(budgetData?.total_spent || 0)}
          </p>
          <p className="summary-description">
            {budgetData?.total_budget 
              ? `${((budgetData.total_spent / budgetData.total_budget) * 100).toFixed(1)}% celkového rozpočtu`
              : 'Z celkového rozpočtu'}
          </p>
        </div>

        <div className="summary-card">
          <h3 className="summary-label">Zbývající rozpočet</h3>
          <p className="summary-value" style={{ 
            color: (budgetData?.total_budget || 0) - (budgetData?.total_spent || 0) >= 0 
              ? '#4ADE80' 
              : '#FF4742' 
          }}>
            {formatCurrency((budgetData?.total_budget || 0) - (budgetData?.total_spent || 0))}
          </p>
          <p className="summary-description">Dostupné k utracení</p>
        </div>
      </div>

      {/* Budgets List */}
      <div className="budgets-container">
        <div className="budgets-section-card">
          <div className="section-header">
            <span>Vaše rozpočty ({budgetData?.budgets?.length || 0})</span>
            <button className="add-budget-btn">+ Přidat rozpočet</button>
          </div>

          {budgetData?.budgets && budgetData.budgets.length > 0 ? (
            <div className="budgets-grid">
              {budgetData.budgets.map((budget: Budget) => {
                const status = getBudgetStatus(budget.percentage_used);
                
                return (
                  <div key={budget.id} className="budget-card">
                    <div className="budget-header">
                      <div className="budget-info">
                        <h3>{budget.name}</h3>
                        <p className="budget-category">{budget.category || 'Obecný rozpočet'}</p>
                      </div>
                      <div className="budget-stats">
                        <p className={`budget-percentage ${status}`}>
                          {budget.percentage_used.toFixed(0)}%
                        </p>
                        <p className="budget-status">{getStatusText(budget.percentage_used)}</p>
                      </div>
                    </div>

                    <div className="budget-amounts">
                      <p className="amount-spent">
                        Utraceno: <strong>{formatCurrency(budget.spent)}</strong>
                      </p>
                      <p className="amount-limit">
                        Limit: <strong>{formatCurrency(budget.amount)}</strong>
                      </p>
                    </div>

                    <div className="budget-progress">
                      <div className="progress-bar-container">
                        <div 
                          className={`progress-bar-fill ${status}`}
                          style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="budget-remaining">
                      Zbývá: <strong>{formatCurrency(budget.remaining)}</strong>
                    </p>

                    <div className="budget-actions">
                      <button className="budget-action-btn">Upravit</button>
                      <button className="budget-action-btn delete">Smazat</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <h3 className="empty-state-title">Žádné rozpočty</h3>
              <p className="empty-state-text">
                Zatím jste nevytvořili žádný rozpočet. Začněte sledovat své výdaje vytvořením prvního rozpočtu.
              </p>
              <button className="empty-state-button">Vytvořit první rozpočet</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Budgets;