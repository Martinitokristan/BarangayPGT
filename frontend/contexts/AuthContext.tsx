'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import api from '@/lib/api';
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
    supabaseUser: SupabaseUser;
    session: Session;
}

interface AuthContextType {
    user: LocalUser | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    pendingDeviceAuth: PendingDeviceAuth | null;
    deviceTrusted: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (updated: Partial<LocalUser>) => void;
    verifyDeviceCode: (code: string) => Promise<void>;
    resendDeviceCode: () => Promise<void>;
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
    const fetchLocalUser = useCallback(async (): Promise<LocalUser | null> => {
        try {
            const res = await api.get('/user');
            return res.data;
        } catch {
            return null;
        }
    }, []);

    // On mount: restore session from Supabase
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data }) => {
            const currentSession = data.session;
            setSession(currentSession);

            if (currentSession) {
                const localUser = await fetchLocalUser();
                setUser(localUser);
            }

            setLoading(false);
        });

        // Listen for auth state changes (sign in, sign out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession);
                if (newSession) {
                    const localUser = await fetchLocalUser();
                    setUser(localUser);
                } else {
                    setUser(null);
                    setPendingDeviceAuth(null);
                }
            }
        );

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Login: sign in with Supabase, then check device trust
    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const supabaseUser = data.user;
        const sess = data.session;

        // Check if this device is trusted (residents only)
        const localUser = await fetchLocalUser();

        if (localUser && localUser.role === 'resident') {
            const deviceToken = getDeviceToken();
            const trusted = localUser && (await api.post('/device/check', { device_token: deviceToken }).catch(() => ({ data: { trusted: false } }))).data.trusted;

            if (!trusted) {
                // Device not trusted — send OTP, hold in pending state
                setPendingDeviceAuth({ supabaseUser, session: sess });
                await api.post('/device/resend-code');
                return;
            }
        }

        setUser(localUser);
        setDeviceTrusted(true);
    };

    // Verify the device OTP code
    const verifyDeviceCode = async (code: string) => {
        if (!pendingDeviceAuth) throw new Error('No pending auth');
        const deviceToken = getDeviceToken();

        await api.post('/device/verify', { code, device_token: deviceToken });

        const localUser = await fetchLocalUser();
        setUser(localUser);
        setDeviceTrusted(true);
        setPendingDeviceAuth(null);
    };

    // Resend OTP code to email
    const resendDeviceCode = async () => {
        await api.post('/device/resend-code');
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setPendingDeviceAuth(null);
    };

    const updateProfile = (updated: Partial<LocalUser>) => {
        setUser((prev) => (prev ? { ...prev, ...updated } : null));
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
