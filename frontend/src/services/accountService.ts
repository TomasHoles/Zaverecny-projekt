import api from './api';

export interface FinancialAccount {
    id: number;
    name: string;
    account_type: 'CHECKING' | 'SAVINGS' | 'CASH' | 'CREDIT' | 'INVESTMENT' | 'OTHER';
    account_type_display: string;
    initial_balance: number;
    current_balance: number;
    currency: string;
    color: string;
    icon: string;
    is_active: boolean;
    is_default: boolean;
    include_in_total: boolean;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface FinancialAccountSummary {
    id: number;
    name: string;
    account_type: string;
    color: string;
    icon: string;
    current_balance: number;
    is_default: boolean;
}

export interface AccountTypeOption {
    value: string;
    label: string;
}

export interface AccountOptions {
    types: AccountTypeOption[];
    colors: AccountTypeOption[];
    icons: AccountTypeOption[];
}

export interface CreateAccountData {
    name: string;
    account_type: string;
    initial_balance?: number;
    currency?: string;
    color?: string;
    icon?: string;
    is_active?: boolean;
    is_default?: boolean;
    include_in_total?: boolean;
    description?: string;
}

class AccountService {
    /**
     * Získá všechny finanční účty uživatele
     */
    async getAccounts(): Promise<FinancialAccount[]> {
        const response = await api.get<FinancialAccount[]>('/accounts/financial-accounts/');
        return response.data;
    }

    /**
     * Získá zkrácený seznam účtů pro výběry
     */
    async getAccountsSummary(): Promise<FinancialAccountSummary[]> {
        const response = await api.get<FinancialAccountSummary[]>('/accounts/financial-accounts/list_summary/');
        return response.data;
    }

    /**
     * Získá jeden účet podle ID
     */
    async getAccount(id: number): Promise<FinancialAccount> {
        const response = await api.get<FinancialAccount>(`/accounts/financial-accounts/${id}/`);
        return response.data;
    }

    /**
     * Vytvoří nový účet
     */
    async createAccount(data: CreateAccountData): Promise<FinancialAccount> {
        const response = await api.post<FinancialAccount>('/accounts/financial-accounts/', data);
        return response.data;
    }

    /**
     * Aktualizuje existující účet
     */
    async updateAccount(id: number, data: Partial<CreateAccountData>): Promise<FinancialAccount> {
        const response = await api.patch<FinancialAccount>(`/accounts/financial-accounts/${id}/`, data);
        return response.data;
    }

    /**
     * Smaže účet
     */
    async deleteAccount(id: number): Promise<void> {
        await api.delete(`/accounts/financial-accounts/${id}/`);
    }

    /**
     * Nastaví účet jako výchozí
     */
    async setDefaultAccount(id: number): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`/accounts/financial-accounts/${id}/set_default/`);
        return response.data;
    }

    /**
     * Získá celkový zůstatek ze všech účtů
     */
    async getTotalBalance(): Promise<{ total_balance: number; accounts_count: number }> {
        const response = await api.get<{ total_balance: number; accounts_count: number }>('/accounts/financial-accounts/total_balance/');
        return response.data;
    }

    /**
     * Získá dostupné typy účtů, barvy a ikony
     */
    async getAccountOptions(): Promise<AccountOptions> {
        const response = await api.get<AccountOptions>('/accounts/financial-accounts/account_types/');
        return response.data;
    }
}

export default new AccountService();
