import React from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { useToast } from "../../contexts/ToastContext";
import {
    HiBell,
    HiClipboardList,
    HiChat,
    HiDocumentAdd,
    HiCheckCircle,
    HiClock,
} from "react-icons/hi";
import { RiShieldStarFill, RiAlarmWarningFill } from "react-icons/ri";

function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export default function Notifications() {
    const toast = useToast();
    const {
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        unreadCount,
    } = useNotifications();

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            toast.success("All notifications marked as read!");
        } catch (e) {
            toast.error("Failed to mark all as read.");
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
        } catch (e) {
            toast.error("Failed to mark as read.");
        }
    };

    const typeIcons = {
        urgent_post: {
            icon: <RiAlarmWarningFill />,
            className: "notif-icon-urgent",
        },
        new_post: { icon: <HiDocumentAdd />, className: "notif-icon-post" },
        status_update: {
            icon: <HiClipboardList />,
            className: "notif-icon-status",
        },
        new_comment: { icon: <HiChat />, className: "notif-icon-comment" },
        admin_response: {
            icon: <RiShieldStarFill />,
            className: "notif-icon-admin",
        },
    };

    const getTypeInfo = (type) =>
        typeIcons[type] || { icon: <HiBell />, className: "" };

    if (loading)
        return <div className="loading-spinner">Loading notifications...</div>;

    return (
        <div className="notifications-container">
            <div className="notifications-header">
                <div className="notif-header-left">
                    <h2>
                        <HiBell /> Notifications
                    </h2>
                    {unreadCount > 0 && (
                        <span className="notif-unread-badge">
                            {unreadCount} unread
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        className="btn-mark-all-read"
                        onClick={handleMarkAllAsRead}
                    >
                        <HiCheckCircle /> Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="notif-empty-state">
                    <div className="notif-empty-icon">
                        <HiBell />
                    </div>
                    <h3>You're all caught up!</h3>
                    <p>No notifications to show right now.</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map((notification, index) => (
                        <div
                            key={notification.id}
                            className={`notification-item ${!notification.is_read ? "unread" : ""} ${notification.type === "urgent_post" ? "notification-urgent" : ""}`}
                            onClick={() =>
                                !notification.is_read &&
                                handleMarkAsRead(notification.id)
                            }
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {!notification.is_read && (
                                <span className="notif-unread-dot" />
                            )}
                            <div
                                className={`notification-icon ${getTypeInfo(notification.type).className}`}
                            >
                                {getTypeInfo(notification.type).icon}
                            </div>
                            <div className="notification-content">
                                <strong>{notification.title}</strong>
                                <p>{notification.message}</p>
                                <span className="notification-time">
                                    <HiClock />
                                    {timeAgo(notification.created_at)}
                                </span>
                            </div>
                            {notification.post_id && (
                                <Link
                                    to={`/posts/${notification.post_id}`}
                                    className="notif-view-btn"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    View
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
