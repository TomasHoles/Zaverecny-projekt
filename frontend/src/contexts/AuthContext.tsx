import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar?: string;
    currency: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
    }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get<User>('/accounts/me/')
                .then(response => setUser(response.data))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.post('/accounts/login/', { email, password });
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const register = async (data: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
    }) => {
        const response = await api.post('/accounts/register/', data);
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register }}>
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