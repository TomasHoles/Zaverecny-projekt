import axios from 'axios';

// Vytvoření axios instance s výchozí konfigurací
const api = axios.create({
    baseURL: 'http://localhost:8000/api',  // URL Django backend serveru
    headers: {
        'Content-Type': 'application/json'  // Výchozí Content-Type pro JSON komunikaci
    }
});

// Request interceptor - automaticky přidá autentifikační token do každého požadavku
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Přidáme Token do Authorization header pro autentifikaci
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;