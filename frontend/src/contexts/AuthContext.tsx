import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Interface pro uživatelská data
interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    currency_preference: string;
    email?: string;
}

// Interface pro AuthContext - definuje všechny dostupné funkce a stav
interface AuthContextType {
    user: User | null;  // Aktuálně přihlášený uživatel
    loading: boolean;   // Loading stav pro inicializaci
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: {
        username: string;
        password: string;
        password2: string;
        first_name?: string;
        last_name?: string;
    }) => Promise<{message: string}>;
    verifyEmail: (token: string) => Promise<{message: string}>;
    resendVerification: (email: string) => Promise<{message: string}>;
}

// Interface pro odpověď z API při přihlášení/registraci
interface AuthResponse {
    token: string;
    user: User;
    message?: string;
}

// Vytvoření React Context pro autentifikaci
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider komponenta - poskytuje autentifikační funkce celé aplikaci
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);  // Aktuálně přihlášený uživatel
    const [loading, setLoading] = useState(true);         // Loading stav při inicializaci

    // useEffect pro kontrolu existujícího tokenu při načtení aplikace
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Pokud existuje token, zkusíme načíst data uživatele
            api.get<User>('/accounts/users/me/')
                .then(response => setUser(response.data))
                .catch(() => localStorage.removeItem('token'))  // Pokud token není platný, odstraníme ho
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Funkce pro přihlášení uživatele
    const login = async (username: string, password: string) => {
        const response = await api.post<AuthResponse>('/accounts/login/', { username, password });
        localStorage.setItem('token', response.data.token);  // Uložíme token do localStorage
        setUser(response.data.user);  // Nastavíme data uživatele
    };

    // Funkce pro odhlášení uživatele
    const logout = () => {
        localStorage.removeItem('token');  // Odstraníme token
        setUser(null);  // Vymažeme data uživatele
    };

    // Funkce pro registraci nového uživatele
    const register = async (data: {
        username: string;
        password: string;
        password2: string;
        first_name?: string;
        last_name?: string;
    }) => {
        try {
            const response = await api.post<{user: User, message: string}>('/accounts/register/', data);
            // Po registraci uživatele nepřihlašujeme automaticky - musí se přihlásit ručně
            return { message: response.data.message || 'Registrace úspěšná!' };
        } catch (error: any) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    // Funkce pro ověření emailu (zatím nepoužíváno)
    const verifyEmail = async (token: string) => {
        const response = await api.post<{message: string}>('/accounts/verify-email/', { token });
        return { message: response.data.message || 'Email byl úspěšně ověřen!' };
    };

    // Funkce pro opětovné odeslání ověřovacího emailu (zatím nepoužíváno)
    const resendVerification = async (email: string) => {
        const response = await api.post<{message: string}>('/accounts/resend-verification/', { email });
        return { message: response.data.message || 'Ověřovací email byl odeslán!' };
    };

    // Vracíme Context Provider s všemi funkcemi a stavem
    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register, verifyEmail, resendVerification }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook pro použití AuthContext v komponentách
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};