/**
 * Analytics.tsx - Pokročilá analytika a vizualizace financí
 * 
 * @author Tomáš Holes
 * @description Komplexní analytická komponenta obsahující:
 *   - Financial Health Score (hodnocení finančního zdraví 0-100)
 *   - Heatmap Calendar (vizualizace denní aktivity)
 *   - Waterfall Chart (kaskádový graf cash flow)
 *   - Category Distribution (koláčové grafy příjmů/výdajů)
 *   - Trend Analysis (analýza trendů v kategoriích)
 *   - AI Insights (personalizovaná doporučení)
 * 
 * @charts Recharts (BarChart, LineChart, PieChart, AreaChart)
 * @components WaterfallChart, CategoryPieChart
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, {
  AnalyticsData,
  FinancialInsight,
  FinancialHealthScore,
  TrendAnalysis,
  CategoryBreakdown
} from '../services/dashboardService';
import WaterfallChart from './WaterfallChart';
import CategoryPieChart from './CategoryPieChart';
import {
  Check, TrendingUp, AlertTriangle, Lightbulb, Star, Info,
  BarChart2, TrendingDown, Minus, PieChart, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import '../styles/Analytics.css';

// Helper funkce pro hodnocení finančního zdraví
const getHealthRating = (score: number) => {
  if (score >= 80) {
    return {
      icon: <Check size={32} color="#10b981" />,
      color: '#10b981'
    };
  } else if (score >= 60) {
    return {
      icon: <TrendingUp size={32} color="#f59e0b" />,
      color: '#f59e0b'
    };
  } else {
    return {
      icon: <AlertTriangle size={32} color="#ef4444" />,
      color: '#ef4444'
    };
  }
};

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [trends, setTrends] = useState<TrendAnalysis[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('1m');
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

        // Paralelní načtení všech dat s error handling pro každý endpoint
        const results = await Promise.allSettled([
          dashboardService.getAnalytics(timeRange),
          dashboardService.getFinancialInsights(timeRange),
          dashboardService.getFinancialHealthScore(),
          dashboardService.getTrends(timeRange),
          dashboardService.getCategoryBreakdown(timeRange)
        ]);

        const analyticsData = results[0].status === 'fulfilled' ? results[0].value : null;
        const insightsData = results[1].status === 'fulfilled' ? results[1].value : [];
        const healthScoreData = results[2].status === 'fulfilled' ? results[2].value : null;
        const trendsData = results[3].status === 'fulfilled' ? results[3].value : [];
        const categoryData = results[4].status === 'fulfilled' ? results[4].value : [];

        setAnalytics(analyticsData);
        setInsights(insightsData);
        setHealthScore(healthScoreData);
        setTrends(trendsData);
        setCategoryBreakdown(categoryData);

        // Pokud analytics data chybí, zobrazíme error
        if (!analyticsData) {
          throw new Error('Nepodařilo se načíst základní analytická data');
        }
      } catch (err: any) {
        console.error('Chyba při načítání analytických dat:', err);

        let errorMessage = 'Nepodařilo se načíst analytická data';

        if (err.response?.status === 401) {
          errorMessage = 'Nejste přihlášeni. Přihlaste se prosím.';
        } else if (err.response?.status === 404) {
          errorMessage = 'API endpoint nenalezen. Zkontrolujte backend.';
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.message) {
          errorMessage = `${errorMessage}: ${err.message}`;
        }

        setError(errorMessage);
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

  // Custom tooltip pro grafy
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Barvy pro kategorie
  const CATEGORY_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE',
    '#85C1E2', '#52B788', '#F28B82', '#FBC02D', '#7986CB'
  ];

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
        <div className="analytics-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div className="loading-spinner"></div>
          <p>Načítám analytická data...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="analytics-page">
        <div className="analytics-empty">
          <p className="error-message">{error || 'Nepodařilo se načíst data'}</p>
          <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="btn-primary">
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

  // Kontrola, zda má uživatel nějaká data
  const hasData = analytics && (
    analytics.total_income > 0 ||
    analytics.total_expenses > 0 ||
    (analytics.monthly_data && analytics.monthly_data.length > 0)
  );

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return { icon: <AlertTriangle size={20} color="#F97316" />, color: '#F97316' };
      case 'tip': return { icon: <Lightbulb size={20} color="#3B82F6" />, color: '#3B82F6' };
      case 'achievement': return { icon: <Star size={20} color="#10B981" />, color: '#10B981' };
      case 'info': return { icon: <Info size={20} color="#6366F1" />, color: '#6366F1' };
      default: return { icon: <BarChart2 size={20} color="#8B5CF6" />, color: '#8B5CF6' };
    }
  };

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
            <button
              className={`time-range-btn ${timeRange === '1y' ? 'active' : ''}`}
              onClick={() => setTimeRange('1y')}
            >
              1 rok
            </button>
          </div>
        </div>
      </div>

      {/* Empty State - když nemáte žádná data */}
      {!hasData && (
        <div className="analytics-empty">
          <h2>Zatím nemáte dostatek dat</h2>
          <p>Začněte přidávat transakce, abychom mohli zobrazit vaši analytiku.</p>
          <a href="/transactions" className="btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Přidat transakci
          </a>
        </div>
      )}

      {/* Data content */}
      {hasData && (
        <>
          {/* Financial Health Score Card */}
          {healthScore && (
            <div className="health-score-card">
              <div className="health-score-header">
                <div className="health-score-icon">
                  {getHealthRating(healthScore.score).icon}
                </div>
                <div className="health-score-info">
                  <h2>Finanční zdraví</h2>
                  <p className="health-score-rating">{healthScore.rating}</p>
                </div>
              </div>
              <div className="health-score-body">
                <div className="health-score-gauge">
                  <svg viewBox="0 0 200 120" className="gauge-svg">
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke={getHealthRating(healthScore.score).color}
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray={`${(healthScore.score / 100) * 251.2} 251.2`}
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                    <text x="100" y="90" textAnchor="middle" className="gauge-score">
                      {healthScore.score.toFixed(0)}
                    </text>
                    <text x="100" y="110" textAnchor="middle" className="gauge-max">
                      / {healthScore.max_score}
                    </text>
                  </svg>
                </div>
                {healthScore.recommendations && healthScore.recommendations.length > 0 && (
                  <div className="health-recommendations">
                    <h4>Doporučení:</h4>
                    <ul>
                      {healthScore.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Insights Section */}
          {insights && insights.length > 0 && (
            <div className="insights-section">
              <h2 className="section-title">Finanční Insights</h2>
              <div className="insights-grid">
                {insights.slice(0, 3).map((insight, idx) => {
                  const iconData = getInsightIcon(insight.type);
                  return (
                    <div key={idx} className={`insight-card insight-${insight.type}`}>
                      <div className="insight-header">
                        <span className="insight-icon">
                          {iconData.icon}
                        </span>
                        <h4>{insight.title}</h4>
                      </div>
                      <p className="insight-message">{insight.message}</p>
                      {insight.amount && (
                        <div className="insight-amount">
                          {formatCurrency(insight.amount)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trends Section */}
          {trends && trends.length > 0 && (
            <div className="trends-section">
              <h2 className="section-title">Trendy</h2>
              <div className="trends-grid">
                {trends.map((trend, idx) => (
                  <div key={idx} className="trend-card">
                    <div className="trend-header">
                      {trend.trend === 'up' ? <TrendingUp size={24} color="#10B981" /> :
                        trend.trend === 'down' ? <TrendingDown size={24} color="#EF4444" /> :
                          <Minus size={24} color="#6B7280" />}
                      <h4>{trend.metric === 'income' ? 'Příjmy' : trend.metric === 'expenses' ? 'Výdaje' : 'Úspory'}</h4>
                    </div>
                    <div className="trend-change">
                      <span className={`trend-percentage ${trend.trend}`}>
                        {trend.change_percentage > 0 ? '+' : ''}{trend.change_percentage.toFixed(1)}%
                      </span>
                      <span className="trend-amount">
                        {trend.change_amount > 0 ? '+' : ''}{formatCurrency(trend.change_amount)}
                      </span>
                    </div>
                    <p className="trend-comparison">{trend.comparison_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Visualizations */}
          {analytics?.transactions && analytics.transactions.length > 0 && (
            <>
              {/* Waterfall Chart */}
              <WaterfallChart
                transactions={analytics.transactions}
                startBalance={0}
              />

              {/* Category Pie Charts */}
              <div className="pie-charts-grid">
                <CategoryPieChart
                  transactions={analytics.transactions}
                  type="EXPENSE"
                />
                <CategoryPieChart
                  transactions={analytics.transactions}
                  type="INCOME"
                />
              </div>
            </>
          )}

          {/* Summary Cards */}
          <div className="analytics-summary">
            <div className="summary-card income-card">
              <div className="card-glow income-glow"></div>
              <div className="summary-icon">
                <TrendingUp size={28} color="#10B981" />
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
                <TrendingDown size={28} color="#EF4444" />
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
                <Star size={28} color="#8B5CF6" />
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

          {/* Charts Section */}
          <div className="analytics-charts">
            {/* Monthly Comparison Chart - Recharts */}
            <div className="chart-card chart-card-full">
              <div className="chart-header">
                <h3>
                  {analytics?.monthly_data && analytics.monthly_data.length > 0 
                    ? analytics.monthly_data[0].month.includes('.') 
                      ? 'Denní přehled - Příjmy vs Výdaje'
                      : analytics.monthly_data[0].month.startsWith('T')
                      ? 'Týdenní přehled - Příjmy vs Výdaje'
                      : 'Měsíční přehled - Příjmy vs Výdaje'
                    : 'Přehled - Příjmy vs Výdaje'}
                </h3>
              </div>
              <div className="recharts-container">
                {analytics?.monthly_data && analytics.monthly_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analytics.monthly_data.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="month"
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.875rem' }}
                        angle={analytics.monthly_data.length > 20 ? -45 : 0}
                        textAnchor={analytics.monthly_data.length > 20 ? 'end' : 'middle'}
                        height={analytics.monthly_data.length > 20 ? 80 : 30}
                      />
                      <YAxis
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.875rem' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: '0.875rem' }}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="income"
                        name="Příjmy"
                        fill="#10B981"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        name="Výdaje"
                        fill="#EF4444"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    <BarChart2 size={48} />
                    <p>Zatím žádná data k zobrazení</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Second Row - Savings Trend + Category Pie */}
          <div className="analytics-charts-row">
            {/* Savings Trend - Area Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Trend úspor v čase</h3>
              </div>
              <div className="recharts-container">
                {analytics?.monthly_data && analytics.monthly_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.monthly_data.slice().reverse()}>
                      <defs>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="month"
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.875rem' }}
                      />
                      <YAxis
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.875rem' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        name="Úspory"
                        stroke="#8B5CF6"
                        strokeWidth={3}
                        fill="url(#colorSavings)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    <TrendingUp size={48} />
                    <p>Žádná data k zobrazení</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Breakdown - Pie Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Výdaje podle kategorií</h3>
              </div>
              <div className="recharts-container">
                {analytics?.category_data && analytics.category_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={analytics.category_data as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.category__name}: ${((entry.total / analytics.total_expenses) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total"
                      >
                        {analytics.category_data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">
                    <PieChart size={48} />
                    <p>Žádné kategorie</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Details List */}
          {analytics?.category_data && analytics.category_data.length > 0 && (
            <div className="chart-card">
              <div className="chart-header">
                <h3>Detailní přehled kategorií</h3>
              </div>
              <div className="category-list">
                {analytics.category_data.map((category, index) => {
                  const percentage = (category.total / analytics.total_expenses) * 100;
                  return (
                    <div key={index} className="category-item">
                      <div className="category-info">
                        <div
                          className="category-color"
                          style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                        ></div>
                        <span className="category-name">{category.category__name || 'Ostatní'}</span>
                      </div>
                      <div className="category-stats">
                        <span className="category-amount">{formatCurrency(category.total)}</span>
                        <span className="category-percentage">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="category-bar-container">
                        <div
                          className="category-bar"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="analytics-insights">
            <div className="insight-card">
              <div className="insight-icon">
                <Lightbulb size={28} color="#F59E0B" />
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
        </>
      )}
    </div>
  );
};

export default Analytics;