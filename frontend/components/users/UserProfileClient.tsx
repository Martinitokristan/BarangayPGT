'use client';

// Interactive layer for User Profiles.
// Gets `initialData` from the Server Component to eliminate loading spinners.
// Handles image uploads, follow toggling, and tab switching on the client.

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AdminSmsButton from "@/components/admin/AdminSmsButton";
import PostCard from "@/components/posts/PostCard";
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
    FaCamera,
} from "react-icons/fa";

interface UserProfileClientProps {
    initialData: any;
    userId: string;
}

export default function UserProfileClient({ initialData, userId }: UserProfileClientProps) {
    const { user: currentUser, updateProfile } = useAuth();
    const isAdmin = currentUser?.role === "admin";
    const { showToast } = useToast();

    const [profileData, setProfileData] = useState<any>(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [activeTab, setActiveTab] = useState("posts");
    const [followLoading, setFollowLoading] = useState(false);
    const [uploading, setUploading] = useState({ profile: false, cover: false });
    const [followSettings, setFollowSettings] = useState({
        notify: initialData?.follow_settings?.notify || false,
        is_snoozed: initialData?.follow_settings?.is_snoozed || false
    });
    const [showFollowMenu, setShowFollowMenu] = useState(false);

    // Fetch on mount if no initial data (pure client-side navigation)
    useEffect(() => {
        if (!initialData && userId) {
            fetchProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users/${userId}/profile`);
            setProfileData(res.data);
            setFollowSettings({
                notify: res.data?.follow_settings?.notify || false,
                is_snoozed: res.data?.follow_settings?.is_snoozed || false
            });
        } catch {
            showToast("Failed to load profile.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) return;

        // Automatically polling for background updates to posts/stats every 30 seconds
        const pollInterval = setInterval(() => {
            refreshProfileStats();
        }, 30000);

        return () => clearInterval(pollInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const refreshProfileStats = async () => {
        try {
            const res = await api.get(`/users/${userId}/profile`);
            setProfileData((prev: any) => {
                if (!prev || prev.user.id !== res.data.user.id) return prev;
                return {
                    ...prev,
                    stats: res.data.stats,
                    // Update posts if on first page to catch new ones
                    posts: prev.posts?.current_page === 1 ? res.data.posts : prev.posts
                };
            });
        } catch (error) {
            console.error("Failed to refresh profile stats", error);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast("Please upload an image file", "error");
            return;
        }

        const maxSize = type === 'profile' ? 5 : 8; // MB
        if (file.size > maxSize * 1024 * 1024) {
            showToast(`Image must be less than ${maxSize}MB`, "error");
            return;
        }

        setUploading(prev => ({ ...prev, [type]: true }));
        const formData = new FormData();
        formData.append('photo', file);

        try {
            const endpoint = type === 'profile' ? '/users/profile-photo' : '/users/cover-photo';
            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setProfileData((prev: any) => ({
                ...prev,
                user: {
                    ...prev.user,
                    [type === 'profile' ? 'avatar' : 'cover_photo']: res.data[type === 'profile' ? 'avatar' : 'cover_photo']
                }
            }));

            if (currentUser?.id === Number(userId)) {
                updateProfile({
                    ...currentUser,
                    [type === 'profile' ? 'avatar' : 'cover_photo']: res.data[type === 'profile' ? 'avatar' : 'cover_photo']
                });
            }

            showToast(res.data.message, "success");
        } catch (error: any) {
            showToast(error.response?.data?.error || `Failed to upload ${type} photo`, "error");
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            showToast("Please login to follow users", "error");
            return;
        }

        setFollowLoading(true);
        try {
            const res = await api.post(`/users/${userId}/follow`);
            setProfileData((prev: any) => ({
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

            showToast(res.data.message, "success");
        } catch (error: any) {
            showToast(error.response?.data?.error || "Failed to follow user", "error");
        } finally {
            setFollowLoading(false);
        }
    };

    const handleToggleNotify = async () => {
        try {
            const res = await api.post(`/users/${userId}/follow/notifications`);
            setFollowSettings(prev => ({ ...prev, notify: res.data.notify }));
            showToast(res.data.message, "success");
        } catch (error) {
            showToast("Failed to update notification settings", "error");
        }
    };

    const handleSnooze = async () => {
        try {
            const res = await api.post(`/users/${userId}/follow/snooze`);
            setFollowSettings(prev => ({ ...prev, is_snoozed: true }));
            showToast(res.data.message, "success");
            setShowFollowMenu(false);
        } catch (error) {
            showToast("Failed to snooze user", "error");
        }
    };

    const shareProfile = () => {
        const profileUrl = typeof window !== 'undefined' ? window.location.origin + `/users/${userId}/profile` : '';

        if (navigator.share) {
            navigator.share({
                title: `${profileData?.user?.name}'s Profile`,
                text: `Check out ${profileData?.user?.name}'s profile on BarangayPGT`,
                url: profileUrl,
            });
        } else {
            navigator.clipboard.writeText(profileUrl);
            showToast("Profile link copied to clipboard!", "success");
        }
    };

    if (loading) {
        return (
            <div className="feed-loading-skeleton">
                <div className="skeleton-card" style={{ height: '200px', borderRadius: '0 0 16px 16px', marginBottom: 0 }} />
                <div className="skeleton-card" style={{ marginTop: '-40px', paddingTop: '60px' }}>
                    <div className="skeleton-header" style={{ justifyContent: 'center', flexDirection: 'column' as const, alignItems: 'center' }}>
                        <div className="skeleton-avatar" style={{ width: '80px', height: '80px' }} />
                        <div className="skeleton-line short" style={{ marginTop: '12px' }} />
                        <div className="skeleton-line shorter" />
                    </div>
                </div>
            </div>
        );
    }

    if (!profileData || !profileData.user) {
        return <div className="empty-state">User not found</div>;
    }

    const { user, posts, stats, is_following } = profileData;
    const isOwnProfile = currentUser?.id === user.id;

    // Check if we are inside the admin layout (admins see the sidebar)
    const isAdminView = isAdmin && typeof window !== 'undefined' && window.location.pathname.includes('/users/');

    return (
        <div className={`user-profile ${isAdminView ? 'admin-view' : ''}`}>
            {/* Profile Cover Section */}
            <div className="profile-header">
                <div
                    className="profile-cover"
                    style={user.cover_photo ? { backgroundImage: `url(${user.cover_photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                    {isOwnProfile && (
                        <div className="cover-upload-trigger">
                            <input
                                type="file"
                                id="cover-upload"
                                hidden
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, 'cover')}
                            />
                            <label htmlFor="cover-upload" className="upload-btn">
                                <FaCamera /> {uploading.cover ? "Uploading..." : "Change Cover"}
                            </label>
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} />
                            ) : (
                                <div className="avatar-placeholder">
                                    <FaUser />
                                </div>
                            )}
                            {isOwnProfile && (
                                <div className="avatar-upload-trigger">
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        hidden
                                        accept="image/*"
                                        onChange={(e) => handlePhotoUpload(e, 'profile')}
                                    />
                                    <label htmlFor="avatar-upload" className="camera-icon">
                                        <FaCamera />
                                    </label>
                                </div>
                            )}
                        </div>
                        {uploading.profile && <div className="avatar-upload-loading">...</div>}
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
                                <span className="stat-value">{stats?.followers_count || 0}</span>
                                <span className="stat-label">followers</span>
                            </div>
                            <span className="stat-dot">·</span>
                            <div className="stat-unit">
                                <span className="stat-value">{stats?.following_count || 0}</span>
                                <span className="stat-label">following</span>
                            </div>
                            <span className="stat-dot">·</span>
                            <div className="stat-unit">
                                <span className="stat-value">{stats?.posts_count || 0}</span>
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
                            {posts?.data?.length > 0 ? (
                                posts.data.map((post: any) => (
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
                                {user.purok_address && (
                                    <div className="about-item">
                                        <strong>Purok Address:</strong>
                                        <span>{user.purok_address}</span>
                                    </div>
                                )}
                                {user.barangay && (
                                    <div className="about-item">
                                        <strong>Barangay:</strong>
                                        <span>{user.barangay.name}</span>
                                    </div>
                                )}
                                <div className="about-item">
                                    <strong>Member Since:</strong>
                                    <span>{stats?.joined_date}</span>
                                </div>
                                <div className="about-item">
                                    <strong>Profile Link:</strong>
                                    <div className="profile-link">
                                        <code>
                                            {typeof window !== 'undefined' ? window.location.origin : ''}/users/
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
