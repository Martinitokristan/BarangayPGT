import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import {
    HiHome,
    HiPlusCircle,
    HiBell,
    HiLogout,
    HiMenu,
    HiX,
} from "react-icons/hi";
import { RiShieldStarFill } from "react-icons/ri";

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

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

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">
                        <RiShieldStarFill />
                    </span>
                    <span className="brand-text">Barangay Sumbongan</span>
                </Link>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? <HiX /> : <HiMenu />}
                </button>

                <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
                    <Link
                        to="/"
                        className="nav-link"
                        onClick={() => setMenuOpen(false)}
                    >
                        <HiHome /> Feed
                    </Link>
                    <Link
                        to="/posts/create"
                        className="nav-link"
                        onClick={() => setMenuOpen(false)}
                    >
                        <HiPlusCircle /> New Post
                    </Link>
                    <Link
                        to="/notifications"
                        className="nav-link notification-link"
                        onClick={() => setMenuOpen(false)}
                    >
                        <HiBell /> Notifications
                        {unreadCount > 0 && (
                            <span className="badge">{unreadCount}</span>
                        )}
                    </Link>
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className="nav-link admin-link"
                            onClick={() => setMenuOpen(false)}
                        >
                            <RiShieldStarFill /> Admin Panel
                        </Link>
                    )}
                    <div className="nav-user">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                        <button
                            onClick={handleLogout}
                            className="btn btn-sm btn-outline"
                        >
                            <HiLogout /> Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
