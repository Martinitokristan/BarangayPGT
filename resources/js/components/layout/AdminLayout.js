import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import {
    HiHome,
    HiViewGrid,
    HiClipboardList,
    HiPlusCircle,
    HiBell,
    HiLogout,
    HiArrowLeft,
    HiMenu,
} from "react-icons/hi";
import { RiShieldStarFill } from "react-icons/ri";

export default function AdminLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get("/notifications/unread-count");
            setUnreadCount(res.data.count);
        } catch (e) {}
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { to: "/admin", icon: <HiViewGrid />, label: "Dashboard" },
        {
            to: "/admin/posts",
            icon: <HiClipboardList />,
            label: "Manage Posts",
        },
        {
            to: "/admin/sms",
            icon: <HiBell />, // You can use a better SMS icon if available
            label: "SMS Management",
        },
    ];

    const quickLinks = [
        { to: "/", icon: <HiHome />, label: "Feed" },
        { to: "/posts/create", icon: <HiPlusCircle />, label: "New Post" },
        {
            to: "/notifications",
            icon: <HiBell />,
            label: "Notifications",
            badge: unreadCount,
        },
    ];

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
                    <div className="sidebar-brand">
                        <span className="sidebar-brand-icon">
                            <RiShieldStarFill />
                        </span>
                        <span className="sidebar-brand-text">Admin Panel</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <span className="sidebar-section-label">Admin</span>
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
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
                                to={item.to}
                                className={`sidebar-link ${isActive(item.to) ? "active" : ""}`}
                            >
                                <span className="sidebar-link-icon">
                                    {item.icon}
                                </span>
                                <span className="sidebar-link-text">
                                    {item.label}
                                </span>
                                {item.badge > 0 && (
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
                    <Link to="/" className="topbar-back" title="Back to Feed">
                        <HiArrowLeft />
                        <span>Back to Site</span>
                    </Link>
                </header>
                <div className="admin-content">{children}</div>
            </div>
        </div>
    );
}
