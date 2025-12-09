/**
 * api.ts - Konfigurace Axios instance pro API komunikaci
 * 
 * @author Tomáš Holes
 * @description Centrální konfigurace pro HTTP požadavky na backend:
 *   - Base URL pro Django REST API
 *   - Automatické přidávání autentizačního tokenu
 *   - Jednotné hlavičky pro JSON komunikaci
 * 
 * @note Token je ukládán v localStorage a automaticky přidáván ke všem požadavkům
 */
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