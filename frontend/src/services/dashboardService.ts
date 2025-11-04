import api from './api';

export interface DashboardStats {
    total_income: number;
    total_expenses: number;
    balance: number;
    recent_transactions: Transaction[];
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
    };
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

export interface AnalyticsData {
    total_income: number;
    total_expenses: number;
    total_savings: number;
    category_data: CategoryData[];
    monthly_data: MonthlyData[];
}

export interface CategoryData {
    category__name: string;
    total: number;
}

export interface MonthlyData {
    month: string;
    income: number;
    expenses: number;
    savings: number;
}

class DashboardService {
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await api.get<DashboardStats>('/transactions/dashboard_stats/');
        return response.data;
    }

    async getBudgetOverview(): Promise<BudgetOverview> {
        const response = await api.get<BudgetOverview>('/budgets/overview/');
        return response.data;
    }

    async getAnalytics(timeRange: string = '6m'): Promise<AnalyticsData> {
        const response = await api.get<AnalyticsData>(`/transactions/analytics/?time_range=${timeRange}`);
        return response.data;
    }
}

export default new DashboardService();