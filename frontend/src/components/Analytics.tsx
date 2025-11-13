import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { AnalyticsData } from '../services/dashboardService';
import Icon from './Icon';
import '../styles/Analytics.css';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('6m');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Nejste přihlášeni. Přihlaste se prosím.');
          setLoading(false);
          return;
        }
        
        console.log('🔍 Načítám analytická data pro:', timeRange);
        const data = await dashboardService.getAnalytics(timeRange);
        console.log('✅ Analytics data:', data);
        setAnalytics(data);
      } catch (err: any) {
        console.error('❌ Chyba při načítání analytických dat:', err);
        console.error('Response:', err.response?.data);
        setError('Nepodařilo se načíst analytická data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, refreshTrigger]);

  // Refresh data when window gains focus (after navigating back from another page)
  useEffect(() => {
    const handleFocus = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMaxAmount = () => {
    if (!analytics || !analytics.monthly_data || analytics.monthly_data.length === 0) return 1000;
    const amounts = [
      ...analytics.monthly_data.map(d => d.income),
      ...analytics.monthly_data.map(d => d.expenses)
    ];
    const max = Math.max(...amounts, 0);
    return max > 0 ? max : 1000; // Minimální hodnota pro prázdné grafy
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Načítám analytická data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-empty">
          <p className="error-message">❌ {error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  const maxAmount = getMaxAmount();

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">
            Analytika
          </h1>
          <p className="analytics-subtitle">Podrobný přehled vašich financí</p>
        </div>
        <div className="analytics-header-actions">
          <button 
            className="refresh-button"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            title="Obnovit data"
          >
            🔄
          </button>
          <div className="time-range-selector">
            <button 
              className={`time-range-btn ${timeRange === '1m' ? 'active' : ''}`}
              onClick={() => setTimeRange('1m')}
            >
              1 měsíc
            </button>
            <button 
              className={`time-range-btn ${timeRange === '3m' ? 'active' : ''}`}
              onClick={() => setTimeRange('3m')}
            >
              3 měsíce
            </button>
            <button 
              className={`time-range-btn ${timeRange === '6m' ? 'active' : ''}`}
              onClick={() => setTimeRange('6m')}
            >
              6 měsíců
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card income-card">
          <div className="summary-icon">
            <Icon name="income" size={28} color="#10B981" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Celkové příjmy</p>
            <p className="summary-value">{formatCurrency(analytics?.total_income || 0)}</p>
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="summary-icon">
            <Icon name="expense" size={28} color="#EF4444" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Celkové výdaje</p>
            <p className="summary-value">{formatCurrency(analytics?.total_expenses || 0)}</p>
          </div>
        </div>

        <div className="summary-card savings-card">
          <div className="summary-icon">
            <Icon name="gem" size={28} color="#8B5CF6" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Úspory</p>
            <p className="summary-value">{formatCurrency(analytics?.total_savings || 0)}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        {/* Monthly Comparison Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Měsíční přehled</h3>
            <small style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>
              {analytics?.monthly_data ? `${analytics.monthly_data.length} měsíců` : 'Načítám...'}
            </small>
          </div>
          <div className="bar-chart">
            {analytics?.monthly_data && analytics.monthly_data.length > 0 ? (
              analytics.monthly_data.slice().reverse().map((month, index) => (
                <div key={index} className="bar-group">
                  <div className="bars">
                    <div 
                      className="bar income-bar"
                      style={{ height: `${(month.income / maxAmount) * 200}px` }}
                      title={`Příjmy: ${formatCurrency(month.income)}`}
                    >
                      {month.income > 0 && <span className="bar-value">{formatCurrency(month.income)}</span>}
                    </div>
                    <div 
                      className="bar expense-bar"
                      style={{ height: `${(month.expenses / maxAmount) * 200}px` }}
                      title={`Výdaje: ${formatCurrency(month.expenses)}`}
                    >
                      {month.expenses > 0 && <span className="bar-value">{formatCurrency(month.expenses)}</span>}
                    </div>
                  </div>
                  <div className="bar-label">{month.month}</div>
                </div>
              ))
            ) : (
              <div className="chart-empty">
                <Icon name="chart" size={48} />
                <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
                  Zatím žádné transakce
                </p>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Přidejte své první příjmy a výdaje pro zobrazení grafů
                </p>
              </div>
            )}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color income-color"></span>
              <span>Příjmy</span>
            </div>
            <div className="legend-item">
              <span className="legend-color expense-color"></span>
              <span>Výdaje</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <h3> Výdaje podle kategorií</h3>
          </div>
          <div className="category-chart">
            {analytics?.category_data && analytics.category_data.length > 0 ? (
              analytics.category_data.map((category, index) => {
                const totalExpenses = analytics.total_expenses || 1;
                const percentage = (category.total / totalExpenses) * 100;
                return (
                  <div key={index} className="category-item">
                    <div className="category-info">
                      <span className="category-name">{category.category__name || 'Ostatní'}</span>
                      <span className="category-amount">{formatCurrency(category.total)}</span>
                    </div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="category-percentage">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })
            ) : (
              <div className="chart-empty">
                <Icon name="target" size={48} />
                <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
                  Zatím žádné výdaje
                </p>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Graf se zobrazí po přidání výdajů s kategoriemi
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="analytics-insights">
        <div className="insight-card">
          <div className="insight-icon">
            <Icon name="lightbulb" size={28} color="#F59E0B" />
          </div>
          <div className="insight-content">
            <h4>Finanční přehled</h4>
            <p>
              {analytics && analytics.total_savings > 0 
                ? `Výborně! Za vybrané období jste ušetřili ${formatCurrency(analytics.total_savings)}. Pokračujte v dobrém hospodaření!`
                : analytics && analytics.total_savings < 0
                ? `Varování: Vaše výdaje převyšují příjmy o ${formatCurrency(Math.abs(analytics.total_savings))}. Zvažte snížení výdajů.`
                : 'Vaše příjmy a výdaje jsou vyrovnané. Zvažte možnosti úspor.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;