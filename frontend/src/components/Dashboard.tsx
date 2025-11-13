import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { DashboardStats, BudgetOverview, Budget } from '../services/dashboardService';
import api from '../services/api';
import Icon from './Icon';
import '../styles/Dashboard.css';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  category_type: 'EXPENSE' | 'INCOME' | 'BOTH';
}

interface QuickTransactionData {
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  description: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [quickFormData, setQuickFormData] = useState<QuickTransactionData>({
    amount: '',
    type: 'EXPENSE',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Nejste přihlášeni. Přihlaste se prosím.');
          setLoading(false);
          return;
        }
        
        // Načteme data postupně, aby chyba v jednom neovlivnila ostatní
        let dashboardData = null;
        let categoriesData = null;
        let budgets = null;

        try {
          dashboardData = await dashboardService.getDashboardStats();
          setStats(dashboardData);
        } catch (err) {
          console.error('Error fetching dashboard stats:', err);
        }

        try {
          categoriesData = await api.get<Category[]>('/transactions/categories/');
          const loadedCategories = categoriesData.data || [];
          
          // Pokud uživatel nemá žádné kategorie, vytvoř výchozí
          if (loadedCategories.length === 0) {
            try {
              await api.post('/transactions/categories/create_defaults/');
              const newCategoriesData = await api.get<Category[]>('/transactions/categories/');
              setCategories(newCategoriesData.data || []);
            } catch (err) {
              console.error('Error creating default categories:', err);
              setCategories([]);
            }
          } else {
            setCategories(loadedCategories);
          }
        } catch (err) {
          console.error('Error fetching categories:', err);
        }

        try {
          budgets = await dashboardService.getBudgetOverview();
          setBudgetData(budgets);
        } catch (err) {
          console.error('Error fetching budgets:', err);
          // Nastavíme prázdná data místo chyby
          setBudgetData({
            budgets: [],
            total_budget: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage: 0
          });
        }

      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        
        let errorMessage = 'Nepodařilo se načíst data';
        
        if (err.response?.status === 401) {
          errorMessage = 'Nejste přihlášeni. Přihlaste se prosím.';
          localStorage.removeItem('token');
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleQuickInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuickFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!quickFormData.amount || parseFloat(quickFormData.amount) <= 0) {
      alert('Zadejte platnou částku');
      return;
    }
    
    if (!quickFormData.type) {
      alert('Vyberte typ transakce');
      return;
    }
    
    if (!quickFormData.category) {
      alert('Vyberte kategorii');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const transactionData = {
        amount: parseFloat(quickFormData.amount),
        type: quickFormData.type,
        category_id: parseInt(quickFormData.category),
        date: quickFormData.date,
        description: quickFormData.description || ''
      };
      
      const response = await api.post('/transactions/transactions/', transactionData);
      
      // Reset form and close modal first
      setQuickFormData({
        amount: '',
        type: 'EXPENSE',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setShowQuickAddModal(false);
      
      // Refresh all dashboard data including stats and budgets
      const [updatedStats, updatedBudgets] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getBudgetOverview()
      ]);
      setStats(updatedStats);
      setBudgetData(updatedBudgets);
      
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      
      let errorMessage = 'Nepodařilo se vytvořit transakci';
      
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        } else if (errors.detail) {
          errorMessage = errors.detail;
        }
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => cat.category_type === quickFormData.type);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Načítám dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="empty-state">
          <p className="empty-state-text">❌ {error}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button onClick={() => window.location.reload()} className="empty-state-action">
              Zkusit znovu
            </button>
            {error.includes('přihlášeni') && (
              <Link to="/login" className="empty-state-action">
                Přihlásit se
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Vítejte, {user?.first_name || user?.username}!
          </h1>
          <p className="dashboard-subtitle">
            Kompletní přehled vašich financí
          </p>
        </div>
        <button 
          onClick={() => setShowQuickAddModal(true)} 
          className="btn-add-transaction"
        >
          + Rychlá transakce
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="income" size={32} color="#10B981" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Celkové příjmy</p>
            <p className="stat-value income">
              {formatCurrency(stats?.total_income || 0)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="expense" size={32} color="#EF4444" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Celkové výdaje</p>
            <p className="stat-value expense">
              {formatCurrency(stats?.total_expenses || 0)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="balance" size={32} color="#3B82F6" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Zůstatek</p>
            <p className="stat-value balance">
              {formatCurrency(stats?.balance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-content-grid">
        {/* Recent Transactions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Poslední transakce</h3>
            <Link to="/transactions" className="view-all-link">
              Zobrazit vše →
            </Link>
          </div>
          
          {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
            <div className="transactions-list">
              {stats.recent_transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <div 
                      className="transaction-category-icon"
                      style={{ backgroundColor: (transaction.category?.color || '#666') + '20' }}
                    >
                      {transaction.category?.icon || '$'}
                    </div>
                    <div className="transaction-details">
                      <p className="transaction-category-name">
                        {transaction.category?.name || 'Bez kategorie'}
                      </p>
                      <p className="transaction-date">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <p 
                    className={`transaction-amount ${
                      transaction.type === 'INCOME' ? 'income' : 'expense'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">
                Zatím nemáte žádné transakce
              </p>
              <Link to="/transactions" className="empty-state-action">
                Přidat první transakci
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Rychlé akce</h3>
          </div>
          <div className="quick-actions">
            <Link to="/transactions" className="quick-action-item">
              <div className="quick-action-icon" style={{ background: '#10B981' }}>
                <Icon name="wallet" size={24} color="white" />
              </div>
              <div className="quick-action-content">
                <p className="quick-action-title">Spravovat transakce</p>
                <p className="quick-action-subtitle">Přidejte nebo upravte transakce</p>
              </div>
            </Link>

            <Link to="/budgets" className="quick-action-item">
              <div className="quick-action-icon" style={{ background: '#F59E0B' }}>
                <Icon name="target" size={24} color="white" />
              </div>
              <div className="quick-action-content">
                <p className="quick-action-title">Rozpočty</p>
                <p className="quick-action-subtitle">Sledujte své výdaje</p>
              </div>
            </Link>

            <Link to="/analytics" className="quick-action-item">
              <div className="quick-action-icon" style={{ background: '#8B5CF6' }}>
                <Icon name="trending-up" size={24} color="white" />
              </div>
              <div className="quick-action-content">
                <p className="quick-action-title">Analytika</p>
                <p className="quick-action-subtitle">Přehledy a grafy</p>
              </div>
            </Link>

            <Link to="/profile" className="quick-action-item">
              <div className="quick-action-icon" style={{ background: '#FF4742' }}>
                <Icon name="user" size={24} color="white" />
              </div>
              <div className="quick-action-content">
                <p className="quick-action-title">Profil</p>
                <p className="quick-action-subtitle">Nastavení účtu</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Top Expenses Widget */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Nejvyšší výdaje</h3>
          </div>
          {stats?.top_expense_categories && stats.top_expense_categories.length > 0 ? (
            <div className="top-expenses-list">
              {stats.top_expense_categories.slice(0, 3).map((category, index) => (
                <div key={index} className="expense-category-item">
                  <div className="expense-category-info">
                    <div 
                      className="expense-category-icon"
                      style={{ backgroundColor: (category.color || '#666') + '20' }}
                    >
                      {category.icon || '$'}
                    </div>
                    <div className="expense-category-details">
                      <p className="expense-category-name">{category.name}</p>
                      <p className="expense-category-amount">{formatCurrency(category.total)}</p>
                    </div>
                  </div>
                  <div className="expense-percentage-bar">
                    <div 
                      className="expense-percentage-fill"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color || '#3B82F6'
                      }}
                    />
                  </div>
                  <span className="expense-percentage-text">{category.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">Zatím žádné výdaje</p>
            </div>
          )}
        </div>

        {/* Savings Trend Widget */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Trend úspor</h3>
          </div>
          {stats && stats.current_month_savings !== undefined && (
            <div className="savings-trend">
              <div className="current-savings">
                <p className="savings-label">Tento měsíc</p>
                <p className={`savings-amount ${stats.current_month_savings >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(Math.abs(stats.current_month_savings))}
                </p>
              </div>
              {stats.savings_change !== undefined && (
                <div className={`savings-change ${stats.savings_change >= 0 ? 'positive' : 'negative'}`}>
                  <span className="change-icon">
                    {stats.savings_change >= 0 ? '↑' : '↓'}
                  </span>
                  <span className="change-percentage">
                    {Math.abs(stats.savings_change).toFixed(1)}%
                  </span>
                  <span className="change-label">oproti minulému měsíci</span>
                </div>
              )}
              <div className="savings-breakdown">
                <div className="savings-row">
                  <span className="savings-row-label">Příjmy:</span>
                  <span className="savings-row-value income">+{formatCurrency(stats.total_income)}</span>
                </div>
                <div className="savings-row">
                  <span className="savings-row-label">Výdaje:</span>
                  <span className="savings-row-value expense">-{formatCurrency(stats.total_expenses)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Budget Overview Section */}
      <div className="dashboard-card budget-overview-card">
        <div className="card-header">
          <h3>Přehled rozpočtů</h3>
          <Link to="/budgets" className="view-all-link">
            Spravovat rozpočty →
          </Link>
        </div>
        {budgetData?.budgets && budgetData.budgets.length > 0 ? (
          <div className="budget-overview-content">
            {budgetData.budgets.slice(0, 3).map((budget: Budget) => (
              <div key={budget.id} className="budget-overview-item">
                <div className="budget-overview-header">
                  <div>
                    <p className="budget-overview-name">{budget.name}</p>
                    <p className="budget-overview-amount">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </p>
                  </div>
                  <div className="budget-overview-stats">
                    <p className="budget-overview-percentage" style={{
                      color: budget.percentage_used > 100 ? '#EF4444' :
                             budget.percentage_used > 80 ? '#F59E0B' : '#10B981'
                    }}>
                      {budget.percentage_used.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="budget-progress-bar">
                  <div 
                    className={`budget-progress-fill ${
                      budget.percentage_used > 100 ? 'danger' :
                      budget.percentage_used > 80 ? 'warning' : 'success'
                    }`}
                    style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                  ></div>
                </div>
                <p className="budget-remaining">
                  Zbývá {formatCurrency(budget.remaining)}
                </p>
              </div>
            ))}
            <div className="budget-summary-row">
              <div className="budget-summary-item">
                <p className="budget-summary-label">Celkem rozpočtů</p>
                <p className="budget-summary-value">{formatCurrency(budgetData.total_budget)}</p>
              </div>
              <div className="budget-summary-item">
                <p className="budget-summary-label">Celkem utraceno</p>
                <p className="budget-summary-value expense">{formatCurrency(budgetData.total_spent)}</p>
              </div>
              <div className="budget-summary-item">
                <p className="budget-summary-label">Zbývá</p>
                <p className="budget-summary-value income">{formatCurrency(budgetData.total_remaining)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-text">Zatím nemáte žádné rozpočty</p>
            <Link to="/budgets" className="empty-state-action">
              Vytvořit první rozpočet
            </Link>
          </div>
        )}
      </div>

      {/* Financial Tips */}
      <div className="dashboard-card tips-card">
        <div className="card-header">
          <h3>Tip dne</h3>
        </div>
        <p className="tip-text">
          Pravidlo 50/30/20: Rozdělte příjmy na 50% potřeby, 30% přání a 20% úspory.
          Toto jednoduché pravidlo vám pomůže udržet finanční rovnováhu a budovat úspory.
        </p>
      </div>

      {/* Quick Add Transaction Modal */}
      {showQuickAddModal && (
        <div className="modal-overlay" onClick={() => setShowQuickAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rychlá transakce</h2>
              <button className="modal-close" onClick={() => setShowQuickAddModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleQuickAddSubmit}>
              <div className="form-group">
                <label htmlFor="quick-amount">Částka (Kč) *</label>
                <input
                  type="number"
                  id="quick-amount"
                  name="amount"
                  value={quickFormData.amount}
                  onChange={handleQuickInputChange}
                  step="0.01"
                  min="0"
                  placeholder="Zadejte částku"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="quick-type">Typ *</label>
                <select
                  id="quick-type"
                  name="type"
                  value={quickFormData.type}
                  onChange={handleQuickInputChange}
                  required
                >
                  <option value="EXPENSE">Výdaj</option>
                  <option value="INCOME">Příjem</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quick-category">Kategorie *</label>
                <select
                  id="quick-category"
                  name="category"
                  value={quickFormData.category}
                  onChange={handleQuickInputChange}
                  required
                >
                  <option value="">Vyberte kategorii</option>
                  {getFilteredCategories().map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="quick-date">Datum *</label>
                <input
                  type="date"
                  id="quick-date"
                  name="date"
                  value={quickFormData.date}
                  onChange={handleQuickInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="quick-description">Poznámka</label>
                <textarea
                  id="quick-description"
                  name="description"
                  value={quickFormData.description}
                  onChange={handleQuickInputChange}
                  placeholder="Volitelná poznámka..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowQuickAddModal(false)}
                  disabled={submitting}
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Ukládání...' : 'Přidat transakci'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default Dashboard;
