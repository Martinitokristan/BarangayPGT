'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';
import ConfirmModal from '@/components/ui/ConfirmModal';
import CommentModal from './CommentModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostUser {
    id: number;
    name: string;
    avatar: string | null;
    barangay?: { name: string };
}

export interface PostData {
    id: number;
    title?: string;
    body?: string;
    description?: string;
    image?: string | null;
    type?: string;
    purpose?: string;
    urgency_level?: string;
    status?: string;
    admin_response?: string | null;
    user_id: number;
    user: PostUser;
    reactions?: Array<{ user_id: number; type: string }>;
    reaction_counts?: Record<string, number>;
    user_reaction?: string | null;
    comments?: CommentData[];
    comments_count?: number;
    created_at: string;
}

export interface CommentData {
    id: number;
    body: string;
    user_id: number;
    user: { id: number; name: string; avatar: string | null };
    liked_by?: number[];
    replies?: CommentData[];
    created_at: string;
}

interface PostCardProps {
    post: PostData;
    onUpdate?: (postId: number, updated: PostData) => void;
    onDelete?: (postId: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTION_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
    Like: { emoji: '👍', label: 'Like', color: '#3b5998' },
    heart: { emoji: '❤️', label: 'Heart', color: '#e74c3c' },
    support: { emoji: '🤝', label: 'Support', color: '#27ae60' },
    sad: { emoji: '😢', label: 'Sad', color: '#3498db' },
};

const PURPOSE_LABELS: Record<string, { icon: string; text: string }> = {
    complaint: { icon: '📋', text: 'Complaint' },
    problem: { icon: '❗', text: 'Problem' },
    emergency: { icon: '🚨', text: 'Emergency' },
    suggestion: { icon: '💡', text: 'Suggestion' },
    general: { icon: '📢', text: 'General' },
};

const STATUS_LABELS: Record<string, { text: string; classes: string }> = {
    pending: { text: 'Pending', classes: 'bg-amber-100 text-amber-700' },
    in_progress: { text: 'In Progress', classes: 'bg-blue-100 text-blue-700' },
    resolved: { text: 'Resolved', classes: 'bg-green-100 text-green-700' },
};

const URGENCY_STYLES: Record<string, { label: string; classes: string }> = {
    high: { label: 'HIGH', classes: 'bg-red-100 text-red-700' },
    medium: { label: 'MEDIUM', classes: 'bg-amber-100 text-amber-700' },
    low: { label: 'LOW', classes: 'bg-green-100 text-green-700' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitialReactions(post: PostData): Record<string, number> {
    if (post.reaction_counts) return post.reaction_counts;
    const counts: Record<string, number> = {};
    (post.reactions || []).forEach((r) => {
        counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return counts;
}

function getUserInitialReaction(post: PostData, userId: number): string | null {
    if (post.user_reaction !== undefined) return post.user_reaction;
    const r = (post.reactions || []).find((r) => r.user_id === userId);
    return r ? r.type : null;
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

export default function PostCard({ post, onUpdate, onDelete }: PostCardProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [reactions, setReactions] = useState(() => getInitialReactions(post));
    const [userReaction, setUserReaction] = useState<string | null>(() => getUserInitialReaction(post, user?.id ?? 0));
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReactionPicker, setShowPicker] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [hoveredReaction, setHovered] = useState<string | null>(null);
    const [showCommentModal, setShowComment] = useState(false);
    const [showImageViewer, setShowImage] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const pressTimerRef = useRef<ReturnType<typeof setTimeout> | 'long-press' | null>(null);
    const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Outside click / touch gestures ────────────────────────────────────────
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowPostMenu(false);
            if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false);
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
                setHovered(null);
            }
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (!showReactionPicker) return;
            if (e.cancelable) e.preventDefault();
            const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
            const item = el?.closest('[data-reaction-type]') as HTMLElement | null;
            setHovered(item ? item.dataset.reactionType ?? null : null);
        };
        const handleTouchEnd = () => {
            if (!showReactionPicker) return;
            if (hoveredReaction) handleReact(hoveredReaction);
            setShowPicker(false);
            setHovered(null);
        };

        document.addEventListener('mousedown', handleClickOutside);
        if (showReactionPicker) {
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showReactionPicker, hoveredReaction]);

    // ─── Reaction handlers ──────────────────────────────────────────────────────
    const handleReact = useCallback(async (type: string) => {
        try {
            const res = await api.post(`/posts/${post.id}/reactions`, { type });
            setReactions(res.data.reaction_counts ?? res.data.reactions ?? {});
            setUserReaction(res.data.user_reaction);
            if (onUpdate) onUpdate(post.id, { ...post, reaction_counts: res.data.reaction_counts, user_reaction: res.data.user_reaction });
        } catch { showToast('Failed to react.', 'error'); }
        setShowPicker(false);
    }, [post, onUpdate, showToast]);

    const handleLikeClick = useCallback(async () => {
        if (pressTimerRef.current === 'long-press') return;
        const type = userReaction ?? 'Like';
        await handleReact(type);
    }, [userReaction, handleReact]);

    const handlePressStart = () => {
        pressTimerRef.current = setTimeout(() => {
            setShowPicker(true);
            setHovered('Like');
            pressTimerRef.current = 'long-press';
        }, 500);
    };

    const handlePressEnd = () => {
        if (pressTimerRef.current && pressTimerRef.current !== 'long-press') {
            clearTimeout(pressTimerRef.current as ReturnType<typeof setTimeout>);
            handleLikeClick();
            pressTimerRef.current = null;
        }
    };

    const handleMouseEnterReaction = () => {
        if (window.innerWidth < 768) return;
        clearTimeout(hoverTimeoutRef.current!);
        hoverTimeoutRef.current = setTimeout(() => setShowPicker(true), 500);
    };

    const handleMouseLeaveReaction = () => {
        clearTimeout(hoverTimeoutRef.current!);
        hoverTimeoutRef.current = setTimeout(() => { setShowPicker(false); setHovered(null); }, 100);
    };

    // ─── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${post.id}`);
            showToast('Post deleted.', 'success');
            if (onDelete) onDelete(post.id);
            else if (onUpdate) onUpdate(post.id, post);
        } catch { showToast('Failed to delete post.', 'error'); }
        setShowDeleteModal(false);
    };

    // ─── Share ──────────────────────────────────────────────────────────────────
    const getPostUrl = () => `${window.location.origin}/posts/${post.id}`;

    const handleShare = (platform: string) => {
        const url = encodeURIComponent(getPostUrl());
        const title = post.title ?? post.body?.slice(0, 60) ?? 'Post';
        const text = encodeURIComponent(`${title} - BarangayPGT`);
        const urls: Record<string, string> = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            messenger: `https://www.facebook.com/dialog/send?link=${url}&app_id=0&redirect_uri=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
        };
        if (platform === 'copy') {
            navigator.clipboard.writeText(getPostUrl());
            showToast('Link copied!', 'success');
        } else if (platform === 'native' && navigator.share) {
            navigator.share({ title, url: getPostUrl() }).catch(() => { });
        } else if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
        setShowShareMenu(false);
    };

    // ─── Derived values ─────────────────────────────────────────────────────────
    const isOwner = user?.id === post.user_id;
    const isAdmin = user?.role === 'admin';
    const canManage = isOwner || isAdmin;
    const isUrgent = post.urgency_level === 'high' && post.status !== 'resolved';
    const urgencyInfo = URGENCY_STYLES[post.urgency_level ?? ''];
    const statusInfo = STATUS_LABELS[post.status ?? ''];
    const purposeInfo = PURPOSE_LABELS[post.purpose ?? ''];
    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);
    const totalComments = post.comments_count ?? (post.comments ?? []).reduce(
        (acc, c) => acc + 1 + (c.replies?.length ?? 0), 0
    );
    const currentReaction = userReaction ? REACTION_CONFIG[userReaction] : null;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isUrgent && isAdmin ? 'border-red-300' : 'border-gray-100'}`}>
            {/* Urgent banner */}
            {isUrgent && isAdmin && (
                <div className="animate-urgent-pulse bg-red-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-1.5">
                    🚨 URGENT POST
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 p-4 pb-2">
                <Link href={`/users/${post.user?.id}/profile`}>
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {post.user?.avatar
                            ? <img src={post.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            : post.user?.name?.charAt(0).toUpperCase()
                        }
                    </div>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/users/${post.user?.id}/profile`} className="font-semibold text-gray-900 text-sm hover:text-blue-600">
                            {post.user?.name}
                        </Link>
                        {purposeInfo && (
                            <span className="text-xs text-gray-500">
                                · {purposeInfo.icon} {purposeInfo.text}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleString()}
                        {post.user?.barangay?.name && ` · ${post.user.barangay.name}`}
                    </span>
                </div>

                {/* Status + urgency badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isAdmin && urgencyInfo && post.status !== 'resolved' && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgencyInfo.classes}`}>
                            {urgencyInfo.label}
                        </span>
                    )}
                    {statusInfo && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.classes}`}>
                            {statusInfo.text}
                        </span>
                    )}
                    {/* 3-dot menu */}
                    {canManage && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowPostMenu(!showPostMenu)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ⋯
                            </button>
                            {showPostMenu && (
                                <div className="animate-menu-fade-in absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40">
                                    <button
                                        onClick={() => { setShowPostMenu(false); router.push(`/posts/${post.id}/edit`); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        ✏️ Edit Post
                                    </button>
                                    <button
                                        onClick={() => { setShowPostMenu(false); setShowDeleteModal(true); }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        🗑️ Delete Post
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-4 pb-2">
                {post.title && (
                    <Link href={`/posts/${post.id}`} className="font-semibold text-gray-900 hover:text-blue-600 block mb-1">
                        {post.title}
                    </Link>
                )}
                {(post.body || post.description) && (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {post.body ?? post.description}
                    </p>
                )}
            </div>

            {/* Image */}
            {post.image && (
                <div className="cursor-zoom-in" onClick={() => setShowImage(true)}>
                    <img
                        src={post.image.startsWith('http') ? post.image : `/storage/${post.image}`}
                        alt="Post"
                        className="w-full object-cover max-h-96"
                    />
                </div>
            )}

            {/* Admin response */}
            {post.admin_response && (isOwner || isAdmin) && (
                <div className="mx-4 my-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">🛡️ Admin Response</p>
                    <p className="text-sm text-gray-700">{post.admin_response}</p>
                </div>
            )}

            {/* Stats row */}
            {(totalReactions > 0 || totalComments > 0) && (
                <div className="flex items-center justify-between px-4 py-1.5 text-xs text-gray-400 border-t border-gray-50">
                    {totalReactions > 0 ? (
                        <div className="flex items-center gap-1">
                            {Object.entries(reactions).map(([type, count]) =>
                                count > 0 ? <span key={type}>{REACTION_CONFIG[type]?.emoji ?? '👍'} {count}</span> : null
                            )}
                        </div>
                    ) : <span />}
                    {totalComments > 0 && (
                        <button onClick={() => setShowComment(true)} className="hover:text-blue-600 hover:underline">
                            {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
                        </button>
                    )}
                </div>
            )}

            {/* Action bar */}
            <div className="flex items-center border-t border-gray-100 px-2 py-1">
                {/* Reaction button with picker */}
                <div className="relative flex-1">
                    <button
                        className={`w-full flex items-center justify-center gap-1.5 py-2 text-sm rounded-xl transition-colors hover:bg-gray-50 ${userReaction ? 'font-semibold' : 'text-gray-500'}`}
                        style={currentReaction ? { color: currentReaction.color } : {}}
                        onClick={handleLikeClick}
                        onMouseEnter={handleMouseEnterReaction}
                        onMouseLeave={handleMouseLeaveReaction}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <span>{currentReaction ? currentReaction.emoji : '👍'}</span>
                        <span>{currentReaction ? currentReaction.label : 'Like'}</span>
                    </button>

                    {/* Reaction picker popup */}
                    {showReactionPicker && (
                        <div
                            ref={pickerRef}
                            className="animate-reaction-picker-pop absolute bottom-12 left-0 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2 flex items-center gap-1"
                            onMouseEnter={() => clearTimeout(hoverTimeoutRef.current!)}
                            onMouseLeave={handleMouseLeaveReaction}
                        >
                            {Object.entries(REACTION_CONFIG).map(([key, config]) => {
                                const reactionAnimClass: Record<string, string> = {
                                    Like: 'animate-react-like',
                                    heart: 'animate-react-love',
                                    support: 'animate-react-haha',
                                    sad: 'animate-react-sad',
                                };
                                return (
                                    <button
                                        key={key}
                                        data-reaction-type={key}
                                        onClick={() => handleReact(key)}
                                        onMouseEnter={() => setHovered(key)}
                                        onMouseLeave={() => setHovered(null)}
                                        className={`relative flex flex-col items-center p-1.5 rounded-xl transition-all ${hoveredReaction === key || userReaction === key ? 'scale-125' : 'hover:scale-110'}`}
                                    >
                                        {hoveredReaction === key && (
                                            <span className="animate-tooltip-fade-in absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                                                {config.label}
                                            </span>
                                        )}
                                        <span className={`text-2xl leading-none ${hoveredReaction === key ? reactionAnimClass[key] ?? 'animate-react-like' : ''}`}>
                                            {config.emoji}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Comment button */}
                <button
                    onClick={() => setShowComment(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 rounded-xl transition-colors hover:bg-gray-50"
                >
                    <span>💬</span><span>Comment</span>
                </button>

                {/* Share button + dropdown */}
                <div
                    className="relative flex-1"
                    ref={shareRef}
                    onMouseEnter={() => { clearTimeout(shareTimeoutRef.current!); setShowShareMenu(true); }}
                    onMouseLeave={() => { shareTimeoutRef.current = setTimeout(() => setShowShareMenu(false), 300); }}
                >
                    <button className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 rounded-xl transition-colors hover:bg-gray-50">
                        <span>↗️</span><span>Share</span>
                    </button>
                    {showShareMenu && (
                        <div className="animate-menu-fade-in absolute bottom-12 right-0 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48">
                            <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">🔗 Copy Link</button>
                            <button onClick={() => handleShare('facebook')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">📘 Facebook</button>
                            <button onClick={() => handleShare('messenger')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">💬 Messenger</button>
                            <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">📱 WhatsApp</button>
                            <button onClick={() => handleShare('twitter')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">🐦 Twitter / X</button>
                            {typeof navigator !== 'undefined' && 'share' in navigator && (
                                <button onClick={() => handleShare('native')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">⋯ More Options</button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Comment Modal */}
            <CommentModal
                isOpen={showCommentModal}
                onClose={() => setShowComment(false)}
                post={post}
                reactionCounts={reactions}
                onUpdate={(updatedPost) => { if (onUpdate) onUpdate(post.id, updatedPost); }}
            />

            {/* Delete confirm */}
            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />

            {/* Image lightbox */}
            {showImageViewer && post.image && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out"
                    onClick={() => setShowImage(false)}
                >
                    <button
                        onClick={() => setShowImage(false)}
                        className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                    >
                        ✕
                    </button>
                    <img
                        src={post.image.startsWith('http') ? post.image : `/storage/${post.image}`}
                        alt="Post"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}
