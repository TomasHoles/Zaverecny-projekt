import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    currency_preference: string;
    currency: string;
    email?: string;
    date_joined: string;
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: {
        username: string;
        password: string;
        password2: string;
        first_name: string;
        last_name: string;
        email?: string;
    }) => Promise<{message: string}>;
    verifyEmail: (token: string) => Promise<{message: string}>;
    resendVerification: (email: string) => Promise<{message: string}>;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

interface AuthResponse {
    token: string;
    user: User;
    message?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get<User>('/accounts/users/me/')
                .then(response => setUser(response.data))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string) => {
        const response = await api.post<AuthResponse>('/accounts/login/', { username, password });
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const register = async (data: {
        username: string;
        password: string;
        password2: string;
        first_name: string;
        last_name: string;
        email?: string;
    }) => {
        const response = await api.post<AuthResponse>('/accounts/register/', data);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return { message: response.data.message || 'Registrace úspěšná!' };
    };

    const verifyEmail = async (token: string) => {
        const response = await api.post<{message: string}>('/accounts/verify-email/', { token });
        return { message: response.data.message || 'Email byl úspěšně ověřen!' };
    };

    const resendVerification = async (email: string) => {
        const response = await api.post<{message: string}>('/accounts/resend-verification/', { email });
        return { message: response.data.message || 'Ověřovací email byl odeslán!' };
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register, verifyEmail, resendVerification, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
