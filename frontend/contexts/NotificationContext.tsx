'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
    id: number;
    type: string;
    message: string;
    is_read: boolean;
    actor?: { id: number; name: string; avatar: string | null };
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(res.data.count);
        } catch { /* silent */ }
    }, [user]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
            const unread = res.data.data.filter((n: Notification) => !n.is_read).length;
            setUnreadCount(unread);
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    }, [user]);

    const markAsRead = useCallback(async (id: number) => {
        await api.put(`/notifications/${id}/read`);
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(async () => {
        await api.put('/notifications/read-all');
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    }, []);

    // Fetch on login, poll every 15 s
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }
        fetchNotifications();
        const interval = setInterval(fetchUnreadCount, 15000);
        return () => clearInterval(interval);
    }, [user, fetchNotifications, fetchUnreadCount]);

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, loading, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications(): NotificationContextType {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
}
