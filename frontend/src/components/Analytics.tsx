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
    return max > 0 ? max : 1000;
  };

  const calculateTrend = () => {
    if (!analytics?.monthly_data || analytics.monthly_data.length < 2) return 0;
    const recent = analytics.monthly_data.slice(-2);
    const older = recent[0].savings;
    const newer = recent[1].savings;
    return ((newer - older) / Math.abs(older || 1)) * 100;
  };

  const getTopCategory = () => {
    if (!analytics?.category_data || analytics.category_data.length === 0) return null;
    return analytics.category_data[0];
  };

  const getSavingsRate = () => {
    if (!analytics) return 0;
    const rate = (analytics.total_savings / (analytics.total_income || 1)) * 100;
    return Math.max(0, Math.min(100, rate));
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
  const trend = calculateTrend();
  const topCategory = getTopCategory();
  const savingsRate = getSavingsRate();

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
          <div className="card-glow income-glow"></div>
          <div className="summary-icon">
            <Icon name="income" size={28} color="#10B981" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Celkové příjmy</p>
            <p className="summary-value">{formatCurrency(analytics?.total_income || 0)}</p>
            <div className="summary-sparkline">
              {analytics?.monthly_data.slice().reverse().map((m, i) => (
                <div 
                  key={i} 
                  className="sparkline-bar income"
                  style={{ height: `${(m.income / maxAmount) * 100}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="card-glow expense-glow"></div>
          <div className="summary-icon">
            <Icon name="expense" size={28} color="#EF4444" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Celkové výdaje</p>
            <p className="summary-value">{formatCurrency(analytics?.total_expenses || 0)}</p>
            <div className="summary-sparkline">
              {analytics?.monthly_data.slice().reverse().map((m, i) => (
                <div 
                  key={i} 
                  className="sparkline-bar expense"
                  style={{ height: `${(m.expenses / maxAmount) * 100}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <div className="summary-card savings-card">
          <div className="card-glow savings-glow"></div>
          <div className="summary-icon">
            <Icon name="gem" size={28} color="#8B5CF6" />
          </div>
          <div className="summary-content">
            <p className="summary-label">Úspory</p>
            <p className="summary-value">{formatCurrency(analytics?.total_savings || 0)}</p>
            <div className="savings-rate-indicator">
              <div className="rate-bar">
                <div 
                  className="rate-fill"
                  style={{ width: `${savingsRate}%` }}
                ></div>
              </div>
              <span className="rate-text">{savingsRate.toFixed(0)}% míra úspor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="trend-cards">
        <div className="trend-card">
          <div className="trend-icon trend-icon-positive">
            {trend >= 0 ? '↗' : '↘'}
          </div>
          <div className="trend-info">
            <span className="trend-label">Trend úspor</span>
            <span className={`trend-value ${trend >= 0 ? 'positive' : 'negative'}`}>
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        </div>

        {topCategory && (
          <div className="trend-card">
            <div className="trend-icon trend-icon-category">▶</div>
            <div className="trend-info">
              <span className="trend-label">Nejvíce utrácíte za</span>
              <span className="trend-value">{topCategory.category__name}</span>
            </div>
          </div>
        )}

        <div className="trend-card">
          <div className="trend-icon trend-icon-money">₿</div>
          <div className="trend-info">
            <span className="trend-label">Průměrný měsíční výdaj</span>
            <span className="trend-value">
              {formatCurrency((analytics?.total_expenses || 0) / (analytics?.monthly_data.length || 1))}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts">
        {/* Monthly Comparison Chart */}
        <div className="chart-card chart-card-large">
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
                      data-value={formatCurrency(month.income)}
                    >
                      {month.income > 0 && <span className="bar-value">{formatCurrency(month.income)}</span>}
                      <div className="bar-shine"></div>
                    </div>
                    <div 
                      className="bar expense-bar"
                      style={{ height: `${(month.expenses / maxAmount) * 200}px` }}
                      title={`Výdaje: ${formatCurrency(month.expenses)}`}
                      data-value={formatCurrency(month.expenses)}
                    >
                      {month.expenses > 0 && <span className="bar-value">{formatCurrency(month.expenses)}</span>}
                      <div className="bar-shine"></div>
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

        {/* Savings Trend Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Trend úspor</h3>
          </div>
          <div className="line-chart">
            {analytics?.monthly_data && analytics.monthly_data.length > 0 ? (
              <div className="line-chart-container">
                <svg className="line-chart-svg" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const data = analytics.monthly_data.slice().reverse();
                    const maxSavings = Math.max(...data.map(d => Math.abs(d.savings)), 1);
                    const points = data.map((d, i) => {
                      const x = (i / (data.length - 1)) * 380 + 10;
                      const y = 120 - ((d.savings + maxSavings) / (maxSavings * 2)) * 100;
                      return `${x},${y}`;
                    }).join(' ');
                    const areaPoints = `10,120 ${points} ${380},120`;
                    return (
                      <>
                        <polyline
                          points={areaPoints}
                          fill="url(#savingsGradient)"
                          stroke="none"
                        />
                        <polyline
                          points={points}
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="animated-line"
                        />
                        {data.map((d, i) => {
                          const x = (i / (data.length - 1)) * 380 + 10;
                          const y = 120 - ((d.savings + maxSavings) / (maxSavings * 2)) * 100;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#8B5CF6"
                              className="chart-point"
                            >
                              <title>{`${d.month}: ${formatCurrency(d.savings)}`}</title>
                            </circle>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            ) : (
              <div className="chart-empty">
                <p>Žádná data k zobrazení</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="analytics-charts">
        {/* Category Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Výdaje podle kategorií</h3>
          </div>
          <div className="category-chart">
            {analytics?.category_data && analytics.category_data.length > 0 ? (
              analytics.category_data.map((category, index) => {
                const totalExpenses = analytics.total_expenses || 1;
                const percentage = (category.total / totalExpenses) * 100;
                const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C1E2'];
                const color = colors[index % colors.length];
                return (
                  <div key={index} className="category-item">
                    <div className="category-info">
                      <span className="category-name">{category.category__name || 'Ostatní'}</span>
                      <span className="category-amount">{formatCurrency(category.total)}</span>
                    </div>
                    <div className="category-bar-container">
                      <div 
                        className="category-bar animated-bar"
                        style={{ 
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                          boxShadow: `0 0 10px ${color}55`
                        }}
                      >
                        <div className="bar-shimmer"></div>
                      </div>
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

        {/* Donut Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Rozložení financí</h3>
          </div>
          <div className="donut-chart">
            {analytics && (analytics.total_income > 0 || analytics.total_expenses > 0) ? (
              <div className="donut-container">
                <svg className="donut-svg" viewBox="0 0 200 200">
                  {(() => {
                    const total = analytics.total_income + analytics.total_expenses;
                    const incomePercent = (analytics.total_income / total) * 100;
                    const expensePercent = (analytics.total_expenses / total) * 100;
                    const circumference = 2 * Math.PI * 60;
                    const incomeLength = (incomePercent / 100) * circumference;
                    const expenseOffset = incomeLength;
                    
                    return (
                      <>
                        <circle
                          cx="100"
                          cy="100"
                          r="60"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="25"
                          strokeDasharray={`${incomeLength} ${circumference}`}
                          strokeDashoffset="0"
                          transform="rotate(-90 100 100)"
                          className="donut-segment"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="60"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="25"
                          strokeDasharray={`${(expensePercent / 100) * circumference} ${circumference}`}
                          strokeDashoffset={-expenseOffset}
                          transform="rotate(-90 100 100)"
                          className="donut-segment"
                        />
                        <text x="100" y="95" textAnchor="middle" fontSize="14" fill="var(--text-secondary)">
                          Rozdělení
                        </text>
                        <text x="100" y="115" textAnchor="middle" fontSize="20" fontWeight="bold" fill="var(--text-primary)">
                          {((analytics.total_income / total) * 100).toFixed(0)}%
                        </text>
                      </>
                    );
                  })()}
                </svg>
                <div className="donut-legend">
                  <div className="donut-legend-item">
                    <span className="donut-dot income"></span>
                    <span>Příjmy ({((analytics.total_income / (analytics.total_income + analytics.total_expenses)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="donut-legend-item">
                    <span className="donut-dot expense"></span>
                    <span>Výdaje ({((analytics.total_expenses / (analytics.total_income + analytics.total_expenses)) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="chart-empty">
                <p>Žádná data</p>
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