import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get("/notifications/unread-count");
            setUnreadCount(res.data.count);
        } catch (e) {}
    }, [user]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get("/notifications");
            setNotifications(res.data.data);
            // Sync unread count from the actual data
            const unread = res.data.data.filter((n) => !n.is_read).length;
            setUnreadCount(unread);
        } catch (e) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    }, [user]);

    const markAsRead = useCallback(async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (e) {
            throw e;
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (e) {
            throw e;
        }
    }, []);

    // Poll for new notifications every 15 seconds
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
            value={{
                notifications,
                unreadCount,
                loading,
                fetchNotifications,
                fetchUnreadCount,
                markAsRead,
                markAllAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
