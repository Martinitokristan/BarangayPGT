'use client';

import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/contexts/ToastContext';

function timeAgo(dateStr: string): string {
    const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (secs < 60) return 'Just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

const TYPE_CONFIG: Record<string, { icon: string; bg: string }> = {
    urgent_post: { icon: '🚨', bg: 'bg-red-100' },
    new_post: { icon: '📝', bg: 'bg-blue-100' },
    status_update: { icon: '📋', bg: 'bg-purple-100' },
    new_comment: { icon: '💬', bg: 'bg-green-100' },
    admin_response: { icon: '🛡️', bg: 'bg-indigo-100' },
};

export default function Notifications() {
    const { notifications, loading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
    const { showToast } = useToast();

    const handleMarkAllAsRead = async () => {
        try { await markAllAsRead(); showToast('All marked as read!', 'success'); }
        catch { showToast('Failed to mark all as read.', 'error'); }
    };

    const handleMarkAsRead = async (id: number) => {
        try { await markAsRead(id); }
        catch { /* silent */ }
    };

    if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading notifications...</div>;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">🔔 Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            {unreadCount} unread
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        ✅ Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
                    <div className="text-4xl mb-3">🔔</div>
                    <h3 className="font-semibold text-gray-900 mb-1">You're all caught up!</h3>
                    <p className="text-sm text-gray-400">No notifications to show right now.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n, i) => {
                        const config = TYPE_CONFIG[n.type] ?? { icon: '🔔', bg: 'bg-gray-100' };
                        return (
                            <div
                                key={n.id}
                                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                                style={{ animationDelay: `${i * 0.04}s` }}
                                className={`flex items-start gap-3 bg-white rounded-2xl shadow-sm border p-4 transition-colors cursor-pointer
                  ${!n.is_read ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100'}
                  ${n.type === 'urgent_post' ? 'border-red-200' : ''}
                `}
                            >
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${config.bg}`}>
                                    {config.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm text-gray-700 leading-snug ${!n.is_read ? 'font-medium' : ''}`}>
                                        {n.message}
                                    </p>
                                    <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        🕐 {timeAgo(n.created_at)}
                                    </span>
                                </div>

                                {/* View link */}
                                {(n as any).post_id && (
                                    <Link
                                        href={`/posts/${(n as any).post_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-shrink-0 text-xs text-blue-600 hover:underline font-medium px-3 py-1.5 bg-blue-50 rounded-lg"
                                    >
                                        View
                                    </Link>
                                )}

                                {/* Unread indicator */}
                                {!n.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
