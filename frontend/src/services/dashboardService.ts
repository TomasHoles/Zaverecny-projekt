import api from './api';

export interface DashboardStats {
    total_income: number;
    total_expenses: number;
    balance: number;
    recent_transactions: Transaction[];
    top_expense_categories?: Array<{
        name: string;
        icon: string;
        color: string;
        total: number;
        percentage: number;
    }>;
    current_month_savings?: number;
    savings_change?: number;
    // Rozšířené KPI
    avg_daily_spending?: number;
    daily_spending_change?: number;
    savings_rate?: number;
    savings_rate_change?: number;
    most_frequent_category?: {
        name: string;
        icon: string;
        color: string;
        count: number;
    };
    upcoming_recurring_count?: number;
    sparkline_data?: number[];
    today_expenses?: number;
    today_change?: number;
}

export interface Transaction {
    id: number;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: {
        id: number;
        name: string;
        color: string;
        icon: string;
        category_type?: 'INCOME' | 'EXPENSE' | 'BOTH';
    } | null;
    date: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface BudgetOverview {
    budgets: Budget[];
    total_budget: number;
    total_spent: number;
    total_remaining: number;
    overall_percentage: number;
}

export interface Budget {
    id: number;
    name: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage_used: number;
    category: string | null;
    period: string;
    is_active: boolean;
}

export interface BudgetAlert {
    budget_id: number;
    name: string;
    amount: number;
    category: string | null;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'danger' | 'exceeded';
}

export interface BudgetAlertsResponse {
    alerts: BudgetAlert[];
    count: number;
}

export interface AnalyticsData {
    total_income: number;
    total_expenses: number;
    total_savings: number;
    category_data: CategoryData[];
    monthly_data: MonthlyData[];
    transactions?: Array<{
        date: string;
        amount: number;
        type: 'INCOME' | 'EXPENSE';
        category?: string;
    }>;
}

export interface CategoryData {
    category__name: string;
    total: number;
}

export interface MonthlyData {
    month: string;
    month_name?: string;
    income: number;
    expenses: number;
    savings: number;
}

export interface SpendingPattern {
    category: string;
    average_amount: number;
    frequency: number;
    trend: 'increasing' | 'decreasing' | 'stable' | 'new';
    percentage_of_total: number;
}

export interface FinancialInsight {
    type: 'warning' | 'tip' | 'achievement' | 'info' | 'overspending' | 'savings_opportunity' | 'unusual_spending' | 'budget_alert' | 'trend_analysis' | 'recommendation';
    severity: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    details?: string;
    category?: string | null;
    data?: Record<string, any>;
    action_url?: string;
    action_text?: string;
    amount?: number | null;
    priority: number;
}

export interface TrendAnalysis {
    period: string;
    metric: 'income' | 'expenses' | 'savings';
    trend: 'up' | 'down' | 'stable';
    change_percentage: number;
    change_amount: number;
    comparison_text: string;
}

export interface CategoryBreakdown {
    category_name: string;
    category_icon: string;
    category_color: string;
    total_amount: number;
    transaction_count: number;
    percentage: number;
    average_transaction: number;
    trend: string;
}

export interface FinancialHealthScore {
    score: number;
    max_score: number;
    rating: string;
    details: any;
    recommendations: string[];
}

class DashboardService {
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await api.get<DashboardStats>('/transactions/transactions/dashboard_stats/');
        return response.data;
    }

    async getBudgetOverview(): Promise<BudgetOverview> {
        const response = await api.get<BudgetOverview>('/budgets/budgets/overview/');
        return response.data;
    }

    async getBudgetAlerts(): Promise<BudgetAlertsResponse> {
        const response = await api.get<BudgetAlertsResponse>('/budgets/budgets/alerts/');
        return response.data;
    }

    async checkAllBudgets(): Promise<any> {
        const response = await api.post('/budgets/budgets/check_all_budgets/');
        return response.data;
    }

    async getAnalytics(timeRange: string = '6m'): Promise<AnalyticsData> {
        const response = await api.get<AnalyticsData>(`/analytics/overview/?time_range=${timeRange}`);
        return response.data;
    }

    async getSpendingPatterns(timeRange: string = '3m'): Promise<SpendingPattern[]> {
        const response = await api.get<SpendingPattern[]>(`/analytics/spending_patterns/?time_range=${timeRange}`);
        return response.data;
    }

    async getFinancialInsights(timeRange: string = '1m'): Promise<FinancialInsight[]> {
        const response = await api.get<FinancialInsight[]>(`/analytics/insights/?time_range=${timeRange}`);
        return response.data;
    }

    async getTrends(timeRange: string = '3m'): Promise<TrendAnalysis[]> {
        const response = await api.get<TrendAnalysis[]>(`/analytics/trends/?time_range=${timeRange}`);
        return response.data;
    }

    async getCategoryBreakdown(timeRange: string = '3m'): Promise<CategoryBreakdown[]> {
        const response = await api.get<CategoryBreakdown[]>(`/analytics/category_breakdown/?time_range=${timeRange}`);
        return response.data;
    }

    async getFinancialHealthScore(): Promise<FinancialHealthScore> {
        const response = await api.get<FinancialHealthScore>('/analytics/health-score/');
        return response.data;
    }
}

export default new DashboardService();