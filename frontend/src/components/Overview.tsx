import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Loader, TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { DashboardStats, AnalyticsData, BudgetOverview, CategoryBreakdown, IncomeBreakdown } from '../services/dashboardService';
import '../styles/Overview.css';

const Overview: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [budgets, setBudgets] = useState<BudgetOverview | null>(null);
    const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<IncomeBreakdown[]>([]);
    const [timeRange, setTimeRange] = useState<string>('1m');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsData, analyticsData, budgetsData, categoriesData, incomeData] = await Promise.all([
                    dashboardService.getDashboardStats(),
                    dashboardService.getAnalytics(timeRange),
                    dashboardService.getBudgetOverview(),
                    dashboardService.getCategoryBreakdown(timeRange),
                    dashboardService.getIncomeBreakdown(timeRange)
                ]);

                setStats(statsData);
                setAnalytics(analyticsData);
                setBudgets(budgetsData);
                setCategories(categoriesData);
                setIncomeCategories(incomeData);
            } catch (error) {
                console.error('Error fetching overview data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    if (loading) {
        return (
            <div className="overview-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader size={40} className="animate-spin" />
            </div>
        );
    }

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: user?.currency_preference || 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Prepare chart data
    const expenseChartData = analytics?.monthly_data.map(d => ({
        name: d.month_name || d.month,
        value: d.expenses
    })) || [];

    const cashFlowData = analytics?.monthly_data.map(d => ({
        name: d.month_name || d.month,
        income: d.income,
        expenses: d.expenses,
        net: d.income - d.expenses
    })) || [];

    // Top 3 categories for Spending Summary
    const topCategories = categories.slice(0, 3);
    
    // Top 3 income categories
    const topIncomeCategories = incomeCategories.slice(0, 3);

    // Calculate expense trend
    const expenseTrend = stats?.daily_spending_change || 0;
    const savingsRate = stats?.savings_rate || 0;

    return (
        <div className="overview-container">
            {/* Greeting Section */}
            <div className="greeting-section">
                <div className="greeting-text">
                    <h1>Přehled</h1>
                    <p className="greeting-subtitle">Vítejte zpět, {user?.first_name || user?.username}. Zde je váš finanční přehled.</p>
                </div>
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

            {/* Top Row Cards */}
            <div className="dashboard-grid top-row">
                {/* Account Summary */}
                <div className="card account-summary">
                    <div className="card-header">
                        <h3><Wallet size={18} /> Přehled účtu</h3>
                    </div>
                    <div className="balance-section">
                        <span className="label">Celkový zůstatek</span>
                        <div className="amount">{formatCurrency(stats?.balance || 0)}</div>
                    </div>
                    <div className="tags-row">
                        <div className={`tag ${(stats?.savings_change || 0) >= 0 ? 'growth' : 'decline'}`}>
                            {(stats?.savings_change || 0) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            Tento měsíc <span>{(stats?.savings_change || 0) >= 0 ? '+' : ''}{formatCurrency(stats?.savings_change || 0)}</span>
                        </div>
                        <div className="tag reward">
                            <PiggyBank size={14} /> Úspory <span>{savingsRate.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>

                {/* Income Overview */}
                <div className="card income-overview">
                    <div className="card-header">
                        <h3><TrendingUp size={18} /> Přehled příjmů</h3>
                        <span className="date">Tento měsíc</span>
                    </div>
                    <div className="income-total">
                        <span className="label">Celkové příjmy</span>
                        <div className="amount">{formatCurrency(stats?.total_income || 0)}</div>
                    </div>
                    <div className="mini-charts-row">
                        {topIncomeCategories.length > 0 ? topIncomeCategories.map((cat, index) => (
                            <div key={index} className="mini-chart-item">
                                <div className="chart-header">
                                    <span className="percentage">{cat.percentage.toFixed(2)}%</span>
                                </div>
                                <div className="chart-label">{cat.category_name}</div>
                                <div className="chart-value">{formatCurrency(cat.total_amount)}</div>
                                <div 
                                    className="mini-chart-viz" 
                                    style={{ backgroundColor: cat.category_color || '#8b5cf6' }}
                                ></div>
                            </div>
                        )) : (
                            <div className="empty-state-small">Žádné příjmy tento měsíc</div>
                        )}
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="card total-expenses">
                    <div className="card-header">
                        <div className="amount-large">{formatCurrency(stats?.total_expenses || 0)}</div>
                        <div className="expense-tags">
                            <div className="tag earned">Příjem <span>+{formatCurrency(stats?.total_income || 0)}</span></div>
                            <div className="tag savings">Úspory <span>{savingsRate.toFixed(2)}%</span></div>
                        </div>
                    </div>
                    <div className="expense-label"><CreditCard size={16} /> Celkové výdaje</div>
                    <div className="expense-chart">
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={expenseChartData}>
                                <defs>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                                <CartesianGrid vertical={false} horizontal={true} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-footer">
                        <span>Poslední 3 měsíce</span>
                        <div className={`trend-indicator ${expenseTrend <= 0 ? 'positive' : 'negative'}`}>
                            {expenseTrend <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            <span>{expenseTrend <= 0 ? '' : '+'}{expenseTrend}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Row */}
            <div className="dashboard-grid middle-row">
                {/* Cash Flow */}
                <div className="card cash-flow">
                    <div className="card-header">
                        <h3>Cash Flow</h3>
                        <span className="period-label">Měsíční přehled</span>
                    </div>
                    <div className="metrics-row">
                        <div className="metric">
                            <div className="value income">{formatCurrency(stats?.total_income || 0)}</div>
                            <div className="label">Příjmy</div>
                        </div>
                        <div className="metric">
                            <div className="value expense">{formatCurrency(stats?.total_expenses || 0)}</div>
                            <div className="label">Výdaje</div>
                        </div>
                        <div className="metric">
                            <div className={`value ${(stats?.balance || 0) >= 0 ? 'positive' : 'negative'}`}>
                                {formatCurrency(stats?.balance || 0)}
                            </div>
                            <div className="label">Bilance</div>
                        </div>
                        <div className="metric">
                            <div className="value">{stats?.upcoming_recurring_count || 0}</div>
                            <div className="label">Opakované</div>
                        </div>
                    </div>

                    <div className="cashflow-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashFlowData}>
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#888', fontSize: 11 }}
                                />
                                <YAxis hide />
                                <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.3)" strokeWidth={1} />
                                <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                                    {cashFlowData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.net >= 0 ? '#ccff00' : '#8b5cf6'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Spending Summary & Budget Control */}
                <div className="right-column">
                    <div className="card spending-summary">
                        <div className="card-header">
                            <h3>Přehled útraty</h3>
                            <Link to="/budgets" className="link-trigger">Rozpočty →</Link>
                        </div>

                        <div className="spending-bars">
                            {topCategories.length > 0 ? topCategories.map((cat, index) => (
                                <div key={index} className="spending-item">
                                    <div className="spending-info">
                                        <span className="category">{cat.category_name}</span>
                                        <span className="amount">{formatCurrency(cat.total_amount)}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${Math.min(cat.percentage, 100)}%`,
                                                background: cat.category_color || '#8b5cf6'
                                            }}
                                        ></div>
                                    </div>
                                    <div className="percentage-label">{cat.percentage.toFixed(2)}%</div>
                                </div>
                            )) : (
                                <div className="empty-state-text">Žádné výdaje tento měsíc</div>
                            )}
                        </div>
                    </div>

                    <div className="card budget-control">
                        <div className="budget-circle-container">
                            <div className="budget-circle">
                                <svg viewBox="0 0 36 36" className="circular-chart">
                                    <path
                                        className="circle-bg"
                                        d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="circle-progress"
                                        strokeDasharray={`${budgets?.overall_percentage || 0}, 100`}
                                        d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <div className="budget-percentage">
                                    {budgets?.overall_percentage ? Math.round(budgets.overall_percentage) : 0}%
                                </div>
                            </div>
                            <div className="budget-text">
                                <div className="budget-title">
                                    <Target size={16} /> Čerpání rozpočtu
                                </div>
                                <p>
                                    {(budgets?.overall_percentage || 0) < 50 
                                        ? 'Výborně! Držíte své výdaje pod kontrolou.'
                                        : (budgets?.overall_percentage || 0) < 80
                                            ? 'Spravujete rozpočet efektivně.'
                                            : 'Pozor, blížíte se k limitu rozpočtu!'}
                                </p>
                                <div className="budget-details">
                                    <span>Utraceno: {formatCurrency(budgets?.total_spent || 0)}</span>
                                    <span>Zbývá: {formatCurrency(budgets?.total_remaining || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <Link to="/transactions" className="action-card">
                    <CreditCard size={24} />
                    <span>Transakce</span>
                </Link>
                <Link to="/budgets" className="action-card">
                    <Wallet size={24} />
                    <span>Rozpočty</span>
                </Link>
                <Link to="/goals" className="action-card">
                    <Target size={24} />
                    <span>Cíle</span>
                </Link>
                <Link to="/analytics" className="action-card">
                    <TrendingUp size={24} />
                    <span>Analytika</span>
                </Link>
            </div>
        </div>
    );
};

export default Overview;
