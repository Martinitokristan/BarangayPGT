import axios from 'axios';
import { createClient } from '@/lib/supabase/client';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Attach the Supabase JWT token to every request
api.interceptors.request.use(async (config) => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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

// Handle 401 responses by signing out
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
