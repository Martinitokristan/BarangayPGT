import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import AdminSmsButton from "../admin/AdminSmsButton";
import PostCard from "../posts/PostCard";
import {
    FaUser,
    FaCalendar,
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope,
    FaShare,
    FaLink,
    FaUserPlus,
    FaUserCheck,
    FaUsers,
    FaUserFriends,
    FaTelegramPlane,
    FaBell,
    FaBellSlash,
    FaClock,
    FaSignOutAlt,
    FaEllipsisV,
} from "react-icons/fa";

export default function UserProfile() {
    const { userId } = useParams();
    const { user: currentUser, isAdmin } = useAuth();
    const toast = useToast();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("posts");
    const [followLoading, setFollowLoading] = useState(false);
    const [followSettings, setFollowSettings] = useState({
        notify: false,
        is_snoozed: false
    });
    const [showFollowMenu, setShowFollowMenu] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get(`/users/${userId}/profile`);
            setProfileData(res.data);
            if (res.data.is_following) {
                setFollowSettings(res.data.follow_settings);
            }
        } catch (error) {
            toast.error("Failed to load user profile");
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            toast.error("Please login to follow users");
            return;
        }

        setFollowLoading(true);
        try {
            const res = await api.post(`/users/${userId}/follow`);
            setProfileData((prev) => ({
                ...prev,
                is_following: res.data.is_following,
                stats: {
                    ...prev.stats,
                    followers_count: res.data.followers_count,
                    following_count: res.data.following_count,
                },
            }));
            
            if (res.data.is_following) {
                setFollowSettings({ notify: false, is_snoozed: false });
            }
            
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to follow user");
        } finally {
            setFollowLoading(false);
        }
    };

    const handleToggleNotify = async () => {
        try {
            const res = await api.post(`/users/${userId}/follow/notifications`);
            setFollowSettings(prev => ({ ...prev, notify: res.data.notify }));
            toast.success(res.data.message);
        } catch (error) {
            toast.error("Failed to update notification settings");
        }
    };

    const handleSnooze = async () => {
        try {
            const res = await api.post(`/users/${userId}/follow/snooze`);
            setFollowSettings(prev => ({ ...prev, is_snoozed: true, snoozed_until: res.data.snoozed_until }));
            toast.success(res.data.message);
            setShowFollowMenu(false);
        } catch (error) {
            toast.error("Failed to snooze user");
        }
    };

    const shareProfile = () => {
        const profileUrl = window.location.origin + `/users/${userId}/profile`;

        if (navigator.share) {
            navigator.share({
                title: `${profileData?.user?.name}'s Profile`,
                text: `Check out ${profileData?.user?.name}'s profile on BarangayPGT`,
                url: profileUrl,
            });
        } else {
            navigator.clipboard.writeText(profileUrl);
            toast.success("Profile link copied to clipboard!");
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-skeleton">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-info">
                        <div className="skeleton-line skeleton-title"></div>
                        <div className="skeleton-line skeleton-text"></div>
                        <div className="skeleton-line skeleton-text"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return <div className="empty-state">User not found</div>;
    }

    const { user, posts, stats, is_following } = profileData;
    const isOwnProfile = currentUser?.id === user.id;

    // Check if we are inside the admin layout (admins see the sidebar)
    const isAdminView = isAdmin && window.location.pathname.includes('/users/');

    return (
        <div className={`user-profile ${isAdminView ? 'admin-view' : ''}`}>
            {/* Profile Cover Section */}
            <div className="profile-header">
                <div className="profile-cover">
                    {/* Cover photo background with gradient */}
                </div>

                <div className="profile-info">
                    <div className="profile-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <div className="avatar-placeholder">
                                <FaUser />
                            </div>
                        )}
                    </div>

                    <div className="profile-details-container">
                        <div className="profile-name-section">
                            <h1>{user.name}</h1>
                            <span className="profile-role">
                                {user.role === "admin"
                                    ? "Administrator"
                                    : "Resident"}
                            </span>
                        </div>

                        <div className="profile-stats-row">
                            <div className="stat-unit">
                                <span className="stat-value">{stats.followers_count}</span>
                                <span className="stat-label">followers</span>
                            </div>
                            <span className="stat-dot">·</span>
                            <div className="stat-unit">
                                <span className="stat-value">{stats.following_count}</span>
                                <span className="stat-label">following</span>
                            </div>
                            <span className="stat-dot">·</span>
                            <div className="stat-unit">
                                <span className="stat-value">{posts.length}</span>
                                <span className="stat-label">posts</span>
                            </div>
                        </div>

                        <div className="profile-meta-list">
                            {user.barangay && (
                                <div className="meta-line">
                                    <FaMapMarkerAlt /> <span>{user.barangay.name}</span>
                                </div>
                            )}
                            {user.email && (
                                <div className="meta-line">
                                    <FaEnvelope /> <span>{user.email}</span>
                                </div>
                            )}
                            {user.phone && (
                                <div className="meta-line">
                                    <FaPhone />
                                    <span>
                                        {user.phone.startsWith("+")
                                            ? user.phone
                                            : `+63${user.phone.slice(1)}`}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="profile-actions-strip">
                            {!isOwnProfile && currentUser && (
                                <div className="follow-action-wrapper">
                                    <button
                                        onClick={is_following ? () => setShowFollowMenu(!showFollowMenu) : handleFollow}
                                        disabled={followLoading}
                                        className={`follow-btn-main ${is_following ? "following" : ""}`}
                                    >
                                        {is_following ? <FaUserCheck /> : <FaUserPlus />}
                                        <span>{is_following ? "Following" : "Follow"}</span>
                                    </button>

                                    {is_following && showFollowMenu && (
                                        <div className="follow-dropdown-menu">
                                            <button className="menu-item" onClick={handleToggleNotify}>
                                                {followSettings.notify ? <FaBellSlash /> : <FaBell />}
                                                <div>
                                                    <span className="item-title">{followSettings.notify ? "Mute Notifications" : "Turn on Notifications"}</span>
                                                    <span className="item-desc">Get notified when they post</span>
                                                </div>
                                            </button>

                                            <button className="menu-item" onClick={handleSnooze}>
                                                <FaClock />
                                                <div>
                                                    <span className="item-title">{followSettings.is_snoozed ? "Snoozed" : "Snooze for 30 days"}</span>
                                                    <span className="item-desc">Hide posts temporarily</span>
                                                </div>
                                            </button>

                                            <div className="menu-divider"></div>

                                            <button className="menu-item unfollow-item" onClick={handleFollow}>
                                                <FaSignOutAlt />
                                                <span className="item-title text-danger">Unfollow</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {isAdmin && !isOwnProfile && user.phone && (
                                <AdminSmsButton user={user} isMeta={true} />
                            )}

                            <button onClick={shareProfile} className="icon-action-btn" title="Share">
                                <FaShare />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="profile-content">
                <div className="content-tabs">
                    <button
                        className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
                        onClick={() => setActiveTab("posts")}
                    >
                        Posts
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
                        onClick={() => setActiveTab("about")}
                    >
                        About
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === "posts" && (
                        <div className="user-posts">
                            {posts.data.length > 0 ? (
                                posts.data.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">📝</div>
                                    <h3>No Posts Yet</h3>
                                    <p>
                                        {user.name} hasn't posted anything yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "about" && (
                        <div className="about-section">
                            <div className="about-card">
                                <h3>About {user.name}</h3>
                                {user.address && (
                                    <div className="about-item">
                                        <strong>Address:</strong>
                                        <span>{user.address}</span>
                                    </div>
                                )}
                                <div className="about-item">
                                    <strong>Role:</strong>
                                    <span>
                                        {user.role === "admin"
                                            ? "Administrator"
                                            : "Resident"}
                                    </span>
                                </div>
                                {user.barangay && (
                                    <div className="about-item">
                                        <strong>Barangay:</strong>
                                        <span>{user.barangay.name}</span>
                                    </div>
                                )}
                                <div className="about-item">
                                    <strong>Member Since:</strong>
                                    <span>{stats.joined_date}</span>
                                </div>
                                <div className="about-item">
                                    <strong>Profile Link:</strong>
                                    <div className="profile-link">
                                        <code>
                                            {window.location.origin}/users/
                                            {userId}/profile
                                        </code>
                                        <button
                                            onClick={() =>
                                                navigator.clipboard.writeText(
                                                    window.location.origin +
                                                        `/users/${userId}/profile`,
                                                )
                                            }
                                            className="copy-btn"
                                        >
                                            <FaLink /> Copy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
