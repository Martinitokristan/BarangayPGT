'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
    HiHome,
    HiViewGrid,
    HiClipboardList,
    HiBell,
    HiLogout,
    HiMenu,
    HiCalendar,
    HiUsers,
} from "react-icons/hi";
import { RiShieldStarFill } from "react-icons/ri";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isAdmin, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Redirect if not admin
    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, loading, router]);

    useEffect(() => {
        if (user && isAdmin) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 60000);
            return () => clearInterval(interval);
        }
    }, [user, isAdmin]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get("/notifications/unread-count");
            setUnreadCount(res.data.count);
        } catch (e) {
            // silent
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { to: "/admin", icon: <HiViewGrid />, label: "Dashboard" },
        {
            to: "/admin/posts",
            icon: <HiClipboardList />,
            label: "Manage Posts",
        },
        {
            to: "/admin/users",
            icon: <HiUsers />,
            label: "Manage Users",
        },
        {
            to: "/admin/sms",
            icon: <HiBell />,
            label: "SMS Management",
        },
        {
            to: "/events",
            icon: <HiCalendar />,
            label: "Manage Events",
        },
    ];

    const quickLinks = [
        { to: "/", icon: <HiHome />, label: "Feed" },
        {
            to: "/notifications",
            icon: <HiBell />,
            label: "Notifications",
            badge: unreadCount,
        },
    ];

    if (loading || !isAdmin) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <div className="admin-layout">
            {mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}
            >
                <div className="sidebar-header">
                    <div className="sidebar-brand" style={{ width: '100%' }}>
                        <span className="sidebar-brand-icon">
                            <RiShieldStarFill />
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="sidebar-brand-text">Admin Panel</span>
                            <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>v3.1 - Fix Build active</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <span className="sidebar-section-label">Admin</span>
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                href={item.to}
                                className={`sidebar-link ${isActive(item.to) ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">
                                    {item.icon}
                                </span>
                                <span className="sidebar-link-text">
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="sidebar-section">
                        <span className="sidebar-section-label">
                            Quick Links
                        </span>
                        {quickLinks.map((item) => (
                            <Link
                                key={item.to}
                                href={item.to}
                                className={`sidebar-link ${isActive(item.to) ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">
                                    {item.icon}
                                </span>
                                <span className="sidebar-link-text">
                                    {item.label}
                                </span>
                                {item.badge && item.badge > 0 && (
                                    <span className="sidebar-badge">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">
                                {user?.name}
                            </span>
                            <span className="sidebar-user-role">
                                Administrator
                            </span>
                        </div>
                    </div>
                    <button
                        className="sidebar-link sidebar-logout"
                        onClick={handleLogout}
                    >
                        <span className="sidebar-link-icon">
                            <HiLogout />
                        </span>
                        <span className="sidebar-link-text">Logout</span>
                    </button>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <button
                        className="topbar-hamburger mobile-only"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        <HiMenu />
                    </button>
                </header>
                <div className="admin-content">{children}</div>
            </div>
        </div>
    );
}
