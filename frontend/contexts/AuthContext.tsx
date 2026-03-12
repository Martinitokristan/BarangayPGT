'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import api, { setAuthToken } from '@/lib/api';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LocalUser {
    id: number;
    name: string;
    email: string;
    role: 'resident' | 'admin';
    avatar: string | null;
    cover_photo: string | null;
    barangay_id: number | null;
    barangay?: { id: number; name: string };
    phone: string | null;
    sex: string | null;
    birth_date: string | null;
    age: number | null;
    address: string | null;
    purok_address: string | null;
    is_approved: boolean;
    email_verified_at: string | null;
    supabase_uid: string | null;
}

interface PendingDeviceAuth {
    data: any;
}

interface AuthContextType {
    user: LocalUser | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    pendingDeviceAuth: PendingDeviceAuth | null;
    deviceTrusted: boolean;
    login: (email: string, password: string) => Promise<{ device_trusted: boolean }>;
    logout: () => Promise<void>;
    updateProfile: (updated: Partial<LocalUser>) => void;
    verifyDeviceCode: (code: string) => Promise<void>;
    resendDeviceCode: () => Promise<void>;
    fetchUser: () => Promise<LocalUser | null>;
    forgotPassword: (method: 'email' | 'phone', identifier: string) => Promise<void>;
    resetPasswordOtp: (phone: string, token: string, password: string, password_confirmation: string) => Promise<void>;
    resetPassword: (token: string, email: string, password: string, password_confirmation: string) => Promise<void>;
    verifyAndLogin: (userObj: LocalUser, tokenHash: string) => void;
    pollRegistrationStatus: (email: string) => Promise<any>;
    resendRegistrationOtp: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();

    const [user, setUser] = useState<LocalUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingDeviceAuth, setPendingDeviceAuth] = useState<PendingDeviceAuth | null>(null);
    const [deviceTrusted, setDeviceTrusted] = useState(false);

    // Generate or retrieve a persistent device token
    const getDeviceToken = (): string => {
        let token = localStorage.getItem('device_token');
        if (!token) {
            token = crypto.randomUUID();
            localStorage.setItem('device_token', token);
        }
        return token;
    };

    // Fetch the local Laravel user record using the current Supabase session
    // Optionally pass a token directly (needed during onAuthStateChange race condition)
    const fetchLocalUser = useCallback(async (token?: string): Promise<LocalUser | null> => {
        try {
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const res = await api.get('/user', config);
            setUser(res.data);
            return res.data;
        } catch {
            return null;
        }
    }, []);

    // On mount: restore session from our custom tokens (localStorage)
    useEffect(() => {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (storedToken) {
            setAuthToken(storedToken);
            fetchLocalUser(storedToken).then((localUser) => {
                setUser(localUser);
                setLoading(false);
            }).catch(() => {
                setAuthToken(null);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [fetchLocalUser]);

    // Login: sign in via Laravel Custom API, then check device trust
    const login = async (email: string, password: string) => {
        const deviceToken = getDeviceToken();
        const res = await api.post('/login', { email, password, device_token: deviceToken });
        
        const data = res.data;
        
        if (!data.device_trusted) {
            // Device not trusted — send OTP, hold in pending state (do not apply token fully yet)
            setPendingDeviceAuth({ data });
            return { device_trusted: false };
        }

        // Apply full login
        setAuthToken(data.token);
        setUser(data.user);
        setDeviceTrusted(true);
        return { device_trusted: true };
    };

    // Verify the device OTP code
    const verifyDeviceCode = async (code: string) => {
        if (!pendingDeviceAuth) throw new Error('No pending auth');
        
        const attemptData = pendingDeviceAuth.data;
        // Temporary set auth token to allow device/verify to proceed securely
        setAuthToken(attemptData.token);
        
        const deviceToken = getDeviceToken();
        await api.post('/device/verify', { code, device_token: deviceToken });

        // Proceed with full login
        const localUser = await fetchLocalUser();
        setUser(localUser);
        setDeviceTrusted(true);
        setPendingDeviceAuth(null);
    };

    // Resend OTP code to email
    const resendDeviceCode = async () => {
        if (!pendingDeviceAuth) return;
        // Tempoarily set token
        const oldToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        setAuthToken(pendingDeviceAuth.data.token);
        await api.post('/device/resend-code');
        setAuthToken(oldToken);
    };

    const logout = async () => {
        await api.post('/logout').catch(() => {});
        setAuthToken(null);
        setUser(null);
        setPendingDeviceAuth(null);
    };

    const updateProfile = (updated: Partial<LocalUser>) => {
        setUser((prev) => (prev ? { ...prev, ...updated } : null));
    };

    const forgotPassword = async (method: 'email' | 'phone', identifier: string) => {
        await api.post('/forgot-password', { method, identifier });
    };

    const resetPasswordOtp = async (phone: string, token: string, password: string, password_confirmation: string) => {
        await api.post('/reset-password/otp', { phone, token, password, password_confirmation });
    };

    const resetPassword = async (token: string, email: string, password: string, password_confirmation: string) => {
        await api.post('/reset-password', { token, email, password, password_confirmation });
    };

    const verifyAndLogin = (userObj: LocalUser, tokenHash: string) => {
        setAuthToken(tokenHash);
        setUser(userObj);
    };

    const pollRegistrationStatus = async (email: string) => {
        const res = await api.get(`/auth/check-status?email=${encodeURIComponent(email)}`);
        return res.data;
    };

    const resendRegistrationOtp = async (email: string) => {
        const res = await api.post('/auth/register/resend-otp', { email });
        return res.data;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                isAdmin: user?.role === 'admin',
                pendingDeviceAuth,
                deviceTrusted,
                login,
                logout,
                updateProfile,
                verifyDeviceCode,
                resendDeviceCode,
                fetchUser: fetchLocalUser,
                forgotPassword,
                resetPasswordOtp,
                resetPassword,
                verifyAndLogin,
                pollRegistrationStatus,
                resendRegistrationOtp,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
