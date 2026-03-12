import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

export const getStorageUrl = (path: string | null | undefined): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    let baseUrl = (envUrl && envUrl !== 'undefined' && envUrl !== '') 
        ? envUrl.replace('/api', '') 
        : 'http://192.168.1.220:8000';

    // Remove trailing/leading slashes to ensure consistent joining
    baseUrl = baseUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    
    const finalUrl = `${baseUrl}/storage/${cleanPath}`;
    
    // Safety check: log if we're not running in production or if requested for debug
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.log(`[Storage URL] Resolved path: ${path} -> ${finalUrl}`);
    }
    
    return finalUrl;
};

// ─── Token Cache ──────────────────────────────────────────────────────────────
// We use a custom local `token` directly provided by the Laravel backend,
// bypassing Supabase's auth rules and free-tier email limitations.
let memoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    memoryToken = token;
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('token', token);
            document.cookie = `token=${token}; path=/; max-age=31536000; samesite=strict`;
        } else {
            localStorage.removeItem('token');
            document.cookie = `token=; path=/; max-age=0; samesite=strict`;
        }
    }
};

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // Hydrate from localStorage if memory is empty
        if (!memoryToken) {
            memoryToken = localStorage.getItem('token');
        }
    }

    if (memoryToken) {
        config.headers.Authorization = `Bearer ${memoryToken}`;
    }


    // Device trust token (stored in localStorage for device verification flow)
    if (typeof window !== 'undefined') {
        const deviceToken = localStorage.getItem('device_token');
        if (deviceToken) {
            config.headers['X-Device-Token'] = deviceToken;
        }
    }

    return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handle 401 responses by signing out
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Don't redirect if already on login page (avoids race condition loop)
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                setAuthToken(null);
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
