import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { Search, Settings, Bell, User, ArrowUpRight, ArrowDownRight, MoreHorizontal, Zap, PieChart, Activity, FileText, CreditCard, Sliders, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import dashboardService, { DashboardStats, AnalyticsData, BudgetOverview, CategoryBreakdown } from '../services/dashboardService';
import '../styles/Overview.css';

const Overview: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Přehled');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [budgets, setBudgets] = useState<BudgetOverview | null>(null);
    const [categories, setCategories] = useState<CategoryBreakdown[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsData, analyticsData, budgetsData, categoriesData] = await Promise.all([
                    dashboardService.getDashboardStats(),
                    dashboardService.getAnalytics('6m'),
                    dashboardService.getBudgetOverview(),
                    dashboardService.getCategoryBreakdown('1m')
                ]);

                setStats(statsData);
                setAnalytics(analyticsData);
                setBudgets(budgetsData);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Error fetching overview data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="overview-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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

    return (
        <div className="overview-container">
            {/* Header */}


            {/* Greeting Section */}
            <div className="greeting-section">
                <div className="greeting-text">
                    <h1>Dobré ráno, <span className="highlight-name">{user?.first_name || user?.username}</span></h1>
                    <p>Váš osobní finanční přehled je připraven.</p>
                </div>
            </div>

            {/* Top Row Cards */}
            <div className="dashboard-grid top-row">
                {/* Account Summary */}
                <div className="card account-summary">
                    <div className="card-header">
                        <h3>Přehled účtu</h3>
                        <div className="dropdown-trigger">Celkem ▼</div>
                    </div>
                    <div className="balance-section">
                        <span className="label">Celkový zůstatek</span>
                        <div className="amount">{formatCurrency(stats?.balance || 0)}</div>
                    </div>
                    <div className="tags-row">
                        <div className="tag growth">
                            <ArrowUpRight size={14} /> Růst <span>+{formatCurrency(stats?.savings_change || 0)}</span>
                        </div>
                        <div className="tag reward">
                            <Zap size={14} /> Úspory <span>{stats?.savings_rate || 0}%</span>
                        </div>
                    </div>
                </div>

                {/* Income Overview */}
                <div className="card income-overview">
                    <div className="card-header">
                        <h3>Přehled příjmů</h3>
                        <span className="date">Tento měsíc</span>
                    </div>
                    <div className="income-total">
                        <span className="label">Celkové příjmy</span>
                        <div className="amount">{formatCurrency(stats?.total_income || 0)}</div>
                    </div>
                    <div className="mini-charts-row">
                        {/* Using mock breakdown as backend doesn't provide specific income categories easily yet */}
                        <div className="mini-chart-item">
                            <div className="chart-header">
                                <span className="percentage">--%</span>
                            </div>
                            <div className="chart-label">Hlavní příjem</div>
                            <div className="chart-value">--</div>
                            <div className="mini-chart-viz purple"></div>
                        </div>
                        <div className="mini-chart-item">
                            <div className="chart-header">
                                <span className="percentage">--%</span>
                            </div>
                            <div className="chart-label">Vedlejší</div>
                            <div className="chart-value">--</div>
                            <div className="mini-chart-viz green"></div>
                        </div>
                        <div className="mini-chart-item">
                            <div className="chart-header">
                                <span className="percentage">--%</span>
                            </div>
                            <div className="chart-label">Investice</div>
                            <div className="chart-value">--</div>
                            <div className="mini-chart-viz teal"></div>
                        </div>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="card total-expenses">
                    <div className="card-header">
                        <div className="amount-large">{formatCurrency(stats?.total_expenses || 0)}</div>
                        <div className="expense-tags">
                            <div className="tag earned">Příjem <span>+{formatCurrency(stats?.total_income || 0)}</span></div>
                            <div className="tag savings">Savings Rate <span>{stats?.savings_rate || 0}%</span></div>
                        </div>
                    </div>
                    <div className="expense-label">Celkové výdaje</div>
                    <div className="expense-chart">
                        <ResponsiveContainer width="100%" height={100}>
                            <AreaChart data={expenseChartData}>
                                <defs>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                                <CartesianGrid vertical={false} horizontal={true} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-footer">
                        <span>Posledních 6 měsíců</span>
                        <div className="reaching-target">
                            <Zap size={14} color="#eaff00" /> Cíl <span>82%</span>
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
                        <div className="dropdown-trigger">Měsíčně ▼</div>
                    </div>
                    <div className="metrics-row">
                        <div className="metric">
                            <div className="value">{formatCurrency(stats?.total_income || 0)}</div>
                            <div className="label">Příchozí</div>
                        </div>
                        <div className="metric">
                            <div className="value">{formatCurrency(stats?.upcoming_recurring_count ? stats.upcoming_recurring_count * 1000 : 0)}</div>
                            <div className="label">Opakované</div>
                        </div>
                        <div className="metric">
                            <div className="value">{formatCurrency(stats?.total_expenses || 0)}</div>
                            <div className="label">Náklady</div>
                        </div>
                        <div className="metric">
                            <div className="value">{formatCurrency(stats?.balance || 0)}</div>
                            <div className="label">Zůstatek</div>
                        </div>
                    </div>

                    <div className="cashflow-chart-container">
                        <div className="floating-stats">
                            <span>Růst příjmů: <span className="green">+{stats?.savings_rate_change || 0}%</span></span>
                            <span>Výdaje: <span className="purple">--%</span></span>
                            <span>Marže: <span className="yellow">{stats?.savings_rate || 0}%</span></span>
                        </div>
                        <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={cashFlowData}>
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

                    <div className="ai-input-section">
                        <div className="ai-icon">✨</div>
                        <input type="text" placeholder="Jakou oblast chcete analyzovat?" />
                        <div className="ai-suggestion">
                            Chci zjistit důvod poklesu v kategorii <span className="highlight">/jídlo a pití</span>
                        </div>
                    </div>
                </div>

                {/* Spending Summary & Budget Control */}
                <div className="right-column">
                    <div className="card spending-summary">
                        <div className="card-header">
                            <h3>Přehled útraty</h3>
                            <div className="link-trigger">Rozpočty →</div>
                        </div>

                        <div className="spending-bars">
                            {topCategories.length > 0 ? topCategories.map((cat, index) => (
                                <div key={index} className="spending-item">
                                    <div className="spending-info">
                                        <span className="amount">{formatCurrency(cat.total_amount)}</span>
                                        <span className="category">{cat.category_name}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${cat.percentage}%`,
                                                background: cat.category_color || (index === 0 ? '#6366f1' : index === 1 ? '#ccff00' : '#f59e0b')
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-state-text">Žádná data k zobrazení</div>
                            )}
                        </div>
                    </div>

                    <div className="card budget-control">
                        <div className="budget-circle-container">
                            <div className="budget-percentage">
                                {budgets?.overall_percentage ? Math.round(budgets.overall_percentage) : 0}%
                            </div>
                            <div className="budget-text">
                                <div className="growth-tag"><ArrowUpRight size={12} /> Čerpání <span className="green">rozpočtu</span></div>
                                <p>Spravujete svůj rozpočet efektivně – výdaje zůstávají v normě.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="transaction-history-header">
                <h3>Historie transakcí</h3>
                <div className="filters">
                    <span>Všechny transakce ▼</span>
                    <button className="filter-btn"><Sliders size={16} /></button>
                </div>
            </div>
        </div>
    );
};

export default Overview;
