import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import api from "../../services/api";
import {
    HiSearch,
    HiBell,
    HiX,
    HiUser,
    HiHome,
    HiCalendar,
    HiMenu,
    HiCog,
    HiQuestionMarkCircle,
    HiLogout,
} from "react-icons/hi";
import { RiShieldStarFill } from "react-icons/ri";

export default function Navbar() {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showHeader, setShowHeader] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => {
        const saved = localStorage.getItem("recent_searches");
        return saved ? JSON.parse(saved) : [];
    });

    // Dynamic title based on route (used for web view or breadcrumbs if needed)
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === "/") return "Community Feed";
        if (path === "/notifications") return "Notifications";
        if (path.startsWith("/users/") && path.endsWith("/profile")) return "Profile";
        return "BarangayPGT";
    };

    // Scroll listener for mobile hiding/showing top bar
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Show header if at the very top
            if (currentScrollY < 10) {
                setShowHeader(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
                // Scrolling down - hide header (if menu/search not open)
                if (!menuOpen && !searchOpen) {
                    setShowHeader(false);
                }
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up - show header
                setShowHeader(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY, menuOpen, searchOpen]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setSearchLoading(true);
                try {
                    const res = await api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
                    setSearchResults(res.data);
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setSearchLoading(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        // Just used to trigger the first result if any
        if (searchResults.length > 0) {
            navigate(`/users/${searchResults[0].id}/profile`);
            setSearchOpen(false);
            setSearchQuery("");
        }
    };

    const handleResultClick = (person) => {
        // Update Recent Searches
        const newRecent = [
            person,
            ...recentSearches.filter(r => r.id !== person.id)
        ].slice(0, 5); // Keep last 5
        setRecentSearches(newRecent);
        localStorage.setItem("recent_searches", JSON.stringify(newRecent));

        navigate(`/users/${person.id}/profile`);
        setSearchOpen(false);
        setSearchQuery("");
    };

    const clearRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem("recent_searches");
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (!user) return null;

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className={`navbar-two-tier ${!showHeader ? "header-hidden" : ""}`}>
                {/* TIER 1: Header (Hides on scroll) */}
                <div className="navbar-header">
                    <div className="navbar-container">
                        <Link to="/" className="navbar-logo">
                            <RiShieldStarFill className="logo-icon" />
                            <span className="logo-text">BarangayPGT</span>
                        </Link>

                        <button 
                            className="header-icon-btn" 
                            onClick={() => setSearchOpen(true)}
                        >
                            <HiSearch />
                        </button>
                    </div>
                </div>

                {/* TIER 2: Tabs (Always Sticky) */}
                <div className="navbar-tabs">
                    <div className="navbar-container">
                        <Link to="/" className={`tab-item ${isActive("/") ? "active" : ""}`}>
                            <HiHome />
                            <span className="tab-label">Feed</span>
                        </Link>

                        {/* Placeholder for Events */}
                        <Link to="/events" className={`tab-item ${isActive("/events") ? "active" : ""}`}>
                            <HiCalendar />
                            <span className="tab-label">Events</span>
                        </Link>

                        <Link to="/notifications" className={`tab-item ${isActive("/notifications") ? "active" : ""}`}>
                            <div className="icon-wrapper">
                                <HiBell />
                                {unreadCount > 0 && (
                                    <span className="tab-badge">{unreadCount}</span>
                                )}
                            </div>
                            <span className="tab-label">Notifications</span>
                        </Link>

                        <Link 
                            to={`/users/${user.id}/profile`} 
                            className={`tab-item ${location.pathname.includes("/profile") ? "active" : ""}`}
                        >
                            <div className="tab-profile-pic-container">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" className="tab-profile-pic" />
                                ) : (
                                    <HiUser />
                                )}
                            </div>
                            <span className="tab-label">Profile</span>
                        </Link>

                        <button 
                            className={`tab-item ${menuOpen ? "active" : ""}`}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <HiMenu />
                            <span className="tab-label">Menu</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Menu Overlay - Moved Outside of transformed nav for fixed positioning consistency */}
            {menuOpen && (
                <div className="navbar-menu-overlay">
                    <div className="menu-header">
                        <h2>Menu</h2>
                        <button onClick={() => setMenuOpen(false)}><HiX /></button>
                    </div>
                    <div className="menu-content">
                        <Link to="/settings" className="menu-item" onClick={() => setMenuOpen(false)}>
                            <div className="menu-icon-bg"><HiCog /></div>
                            <span>Settings</span>
                        </Link>
                        <Link to="/help" className="menu-item" onClick={() => setMenuOpen(false)}>
                            <div className="menu-icon-bg"><HiQuestionMarkCircle /></div>
                            <span>Help & Support</span>
                        </Link>
                        <button className="menu-item logout-btn" onClick={handleLogout}>
                            <div className="menu-icon-bg logout"><HiLogout /></div>
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Search Overlay - Moved Outside of transformed nav for fixed positioning consistency */}
            {searchOpen && (
                <div className="navbar-search-overlay">
                    <form onSubmit={handleSearchSubmit} className="search-container">
                        <button type="button" className="search-back-btn" onClick={() => setSearchOpen(false)}>
                            <HiX />
                        </button>
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Search BarangayPGT..."
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button 
                                    type="button" 
                                    className="search-clear-btn"
                                    onClick={clearSearch}
                                >
                                    <HiX />
                                </button>
                            )}
                        </div>
                        <button type="submit" className="search-submit"><HiSearch /></button>
                    </form>

                    <div className="search-results-overlay">
                        {/* Recent Searches */}
                        {!searchQuery && recentSearches.length > 0 && (
                            <div className="recent-searches-section">
                                <div className="recent-header">
                                    <span>Recent Visits</span>
                                    <button onClick={clearRecent}>Clear All</button>
                                </div>
                                <div className="search-results-list">
                                    {recentSearches.map((resident) => (
                                        <div 
                                            key={`recent-${resident.id}`} 
                                            className="search-result-item"
                                            onClick={() => handleResultClick(resident)}
                                        >
                                            <div className="result-avatar">
                                                {resident.avatar ? (
                                                    <img src={resident.avatar} alt={resident.name} />
                                                ) : (
                                                    <HiUser />
                                                )}
                                            </div>
                                            <div className="result-info">
                                                <div className="result-name">{resident.name}</div>
                                                <div className="result-role">Recently visited</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchLoading && <div className="search-status">Searching...</div>}
                        {searchQuery && !searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                            <div className="search-status">No residents found.</div>
                        )}
                        <div className="search-results-list">
                            {searchResults.map((resident) => (
                                <div 
                                    key={resident.id} 
                                    className="search-result-item"
                                    onClick={() => handleResultClick(resident)}
                                >
                                    <div className="result-avatar">
                                        {resident.avatar ? (
                                            <img src={resident.avatar} alt={resident.name} />
                                        ) : (
                                            <HiUser />
                                        )}
                                    </div>
                                    <div className="result-info">
                                        <div className="result-name">{resident.name}</div>
                                        <div className="result-role">{resident.role === 'admin' ? 'Barangay Official' : 'Resident'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

