import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { HiBell, HiClipboardList, HiChat, HiDocumentAdd } from "react-icons/hi";
import { RiShieldStarFill, RiAlarmWarningFill } from "react-icons/ri";

export default function Notifications() {
    const toast = useToast();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications");
            setNotifications(res.data.data);
        } catch (e) {
            toast.error("Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(
                notifications.map((n) =>
                    n.id === id ? { ...n, is_read: true } : n,
                ),
            );
        } catch (e) {
            toast.error("Failed to mark as read.");
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications(
                notifications.map((n) => ({ ...n, is_read: true })),
            );
            toast.success("All notifications marked as read.");
        } catch (e) {
            toast.error("Failed to mark all as read.");
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
                <h2>
                    <HiBell /> Notifications
                </h2>
                {notifications.some((n) => !n.is_read) && (
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={markAllAsRead}
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="empty-state">
                    <p>No notifications yet.</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`notification-item ${!notification.is_read ? "unread" : ""} ${notification.type === "urgent_post" ? "notification-urgent" : ""}`}
                            onClick={() =>
                                !notification.is_read &&
                                markAsRead(notification.id)
                            }
                        >
                            <div
                                className={`notification-icon ${getTypeInfo(notification.type).className}`}
                            >
                                {getTypeInfo(notification.type).icon}
                            </div>
                            <div className="notification-content">
                                <strong>{notification.title}</strong>
                                <p>{notification.message}</p>
                                <span className="notification-time">
                                    {new Date(
                                        notification.created_at,
                                    ).toLocaleString()}
                                </span>
                            </div>
                            {notification.post_id && (
                                <Link
                                    to={`/posts/${notification.post_id}`}
                                    className="btn btn-sm btn-outline"
                                >
                                    View Post
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
