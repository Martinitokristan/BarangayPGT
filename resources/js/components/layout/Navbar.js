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
    HiSearch,
    HiUserCircle,
} from "react-icons/hi";
import { RiShieldStarFill } from "react-icons/ri";

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
            setSearchQuery("");
        }
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

                <div className="navbar-actions">
                    <button
                        className="nav-icon-btn"
                        onClick={() => setSearchOpen(!searchOpen)}
                        title="Search"
                    >
                        <HiSearch />
                    </button>
                    <Link
                        to={`/users/${user.id}/profile`}
                        className="nav-icon-btn profile-link"
                        title="My Profile"
                    >
                        <HiUserCircle />
                    </Link>
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <HiX /> : <HiMenu />}
                    </button>
                </div>

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

            {searchOpen && (
                <div className="navbar-search-overlay">
                    <form onSubmit={handleSearchSubmit} className="search-container">
                        <HiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Find posts, issues, and more..."
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button 
                            type="button"
                            className="close-search"
                            onClick={() => setSearchOpen(false)}
                        >
                            <HiX />
                        </button>
                    </form>
                </div>
            )}
        </nav>
    );
}
