'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import api from '@/lib/api';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { PostData, CommentData } from './PostCard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: string): string {
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
    if (secs < 2592000) return `${Math.floor(secs / 86400)}d`;
    if (secs < 31536000) return `${Math.floor(secs / 2592000)}mo`;
    return `${Math.floor(secs / 31536000)}y`;
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

interface ReplyTarget {
    id: number;
    name: string;
    threadParentId: number;
    depth: number;
}

interface CommentItemProps {
    comment: CommentData;
    postId: number;
    depth?: number;
    threadParentId?: number;
    onSetReplyTarget: (target: ReplyTarget) => void;
    onDelete: (id: number) => void;
    onUpdate: (id: number, body: string) => void;
    onRepliesUpdate?: (commentId: number, replies: CommentData[]) => void;
}

export function CommentItem({
    comment, postId, depth = 0, threadParentId,
    onSetReplyTarget, onDelete, onUpdate, onRepliesUpdate,
}: CommentItemProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const menuRef = useRef<HTMLDivElement>(null);

    const [showMenu, setShowMenu] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(comment.body);
    const [replies, setReplies] = useState<CommentData[]>(comment.replies ?? []);
    const [showReplies, setShowReplies] = useState(false);
    const [likedBy, setLikedBy] = useState<number[]>(comment.liked_by ?? []);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const isOwner = user?.id === comment.user_id;
    const isAdmin = user?.role === 'admin';
    const canManage = isOwner || isAdmin;
    const userLiked = user ? likedBy.includes(user.id) : false;

    const handleLike = async () => {
        try {
            const res = await api.post(`/posts/${postId}/comments/${comment.id}/like`);
            setLikedBy(res.data.liked_by);
        } catch { showToast('Failed to like comment.', 'error'); }
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;
        try {
            await api.put(`/posts/${postId}/comments/${comment.id}`, { body: editText });
            onUpdate(comment.id, editText);
            setEditing(false);
        } catch { showToast('Failed to update comment.', 'error'); }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${postId}/comments/${comment.id}`);
            onDelete(comment.id);
        } catch { showToast('Failed to delete comment.', 'error'); }
        setShowDeleteModal(false);
    };

    return (
        <div className={`flex gap-2.5 ${depth > 0 ? 'ml-10 mt-2' : ''}`}>
            {/* Avatar */}
            <Link href={`/users/${comment.user?.id}/profile`} className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                    {comment.user?.avatar
                        ? <img src={comment.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        : comment.user?.name?.charAt(0).toUpperCase()
                    }
                </div>
            </Link>

            <div className="flex-1 min-w-0">
                {/* Comment bubble */}
                <div className="bg-gray-100 rounded-2xl px-3.5 py-2.5 relative">
                    <div className="flex items-start justify-between gap-2">
                        <Link href={`/users/${comment.user?.id}/profile`} className="text-sm font-semibold text-gray-900 hover:text-blue-600">
                            {comment.user?.name}
                        </Link>

                        {/* Menu */}
                        {canManage && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="text-gray-400 hover:text-gray-600 text-xs p-1 rounded transition-colors"
                                >
                                    ···
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-6 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36">
                                        {isOwner && (
                                            <button
                                                onClick={() => { setShowMenu(false); setEditing(true); setEditText(comment.body); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                                            >
                                                ✏️ Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Body or edit form */}
                    {editing ? (
                        <div className="mt-1">
                            <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false); }}
                                autoFocus
                                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2 mt-1.5">
                                <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                                <button onClick={handleEdit} className="text-xs text-blue-600 font-semibold hover:text-blue-700">Save</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-800 mt-0.5 leading-snug">{comment.body}</p>
                    )}
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-3 px-1 mt-1 text-xs text-gray-400">
                    <button
                        onClick={handleLike}
                        className={`font-medium hover:text-blue-600 transition-colors ${userLiked ? 'text-blue-600' : ''}`}
                    >
                        Like{likedBy.length > 0 ? ` · ${likedBy.length}` : ''}
                    </button>
                    {depth === 0 && replies.length < 50 && (
                        <button
                            onClick={() => onSetReplyTarget({ id: comment.id, name: comment.user?.name, threadParentId: threadParentId ?? comment.id, depth })}
                            className="font-medium hover:text-blue-600 transition-colors"
                        >
                            Reply
                        </button>
                    )}
                    <span>{timeAgo(comment.created_at)}</span>
                </div>

                {/* Replies */}
                {replies.length > 0 && depth === 0 && (
                    <div className="mt-2">
                        {!showReplies ? (
                            <button
                                onClick={() => setShowReplies(true)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                ↩ View {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                            </button>
                        ) : (
                            <div className="space-y-2">
                                {replies.map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        postId={postId}
                                        depth={depth + 1}
                                        threadParentId={threadParentId ?? comment.id}
                                        onSetReplyTarget={onSetReplyTarget}
                                        onDelete={(id) => {
                                            const updated = replies.filter((r) => r.id !== id);
                                            setReplies(updated);
                                            if (onRepliesUpdate) onRepliesUpdate(comment.id, updated);
                                        }}
                                        onUpdate={(id, body) => {
                                            const updated = replies.map((r) => r.id === id ? { ...r, body } : r);
                                            setReplies(updated);
                                            if (onRepliesUpdate) onRepliesUpdate(comment.id, updated);
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={() => onSetReplyTarget({ id: comment.id, name: comment.user?.name, threadParentId: threadParentId ?? comment.id, depth })}
                                    className="text-xs text-gray-400 hover:text-gray-600 ml-10"
                                >
                                    Write a reply...
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Comment"
                message="Are you sure you want to delete this comment?"
                confirmText="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}

// ─── CommentModal ─────────────────────────────────────────────────────────────

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: PostData;
    reactionCounts?: Record<string, number>;
    onUpdate?: (updatedPost: PostData) => void;
}

export default function CommentModal({ isOpen, onClose, post, reactionCounts = {}, onUpdate }: CommentModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [comments, setComments] = useState<CommentData[]>(post.comments ?? []);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const touchStartY = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setDragY(0);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const syncToParent = (updated: CommentData[]) => {
        if (onUpdate) {
            const total = updated.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);
            onUpdate({ ...post, comments: updated, comments_count: total });
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const isReply = !!replyTarget;
            const mention = (isReply && replyTarget!.depth > 0) ? `@${replyTarget!.name} ` : '';
            const res = await api.post(`/posts/${post.id}/comments`, {
                body: mention + newComment,
                parent_id: isReply ? replyTarget!.threadParentId : null,
            });

            let updated: CommentData[];
            if (isReply) {
                updated = comments.map((c) =>
                    c.id === replyTarget!.threadParentId
                        ? { ...c, replies: [...(c.replies ?? []), res.data] }
                        : c
                );
            } else {
                updated = [res.data, ...comments];
            }

            setComments(updated);
            syncToParent(updated);
            setNewComment('');
            setReplyTarget(null);
            if (!isReply && scrollRef.current) scrollRef.current.scrollTop = 0;
        } catch { showToast('Failed to post comment.', 'error'); }
        finally { setSubmitting(false); }
    };

    const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

    const portal = (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <div className="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Sheet */}
            <div
                className="animate-slide-up relative bg-white rounded-t-3xl flex flex-col max-h-[90vh]"
                style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : '', transition: isDragging ? 'none' : 'transform 0.3s ease' }}
            >
                {/* Drag handle + header */}
                <div
                    className="flex flex-col items-center pt-3 pb-2 border-b border-gray-100 cursor-grab"
                    onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; setIsDragging(true); }}
                    onTouchMove={(e) => { const dy = e.touches[0].clientY - touchStartY.current; if (dy > 0) setDragY(dy); }}
                    onTouchEnd={() => { setIsDragging(false); if (dragY > 60) onClose(); else setDragY(0); }}
                >
                    <div className="w-10 h-1 bg-gray-300 rounded-full mb-3" />
                    <div className="w-full flex items-center justify-between px-4">
                        <span className="font-semibold text-gray-900">Comments</span>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">✕</button>
                    </div>
                </div>

                {/* Reaction summary */}
                {totalReactions > 0 && (
                    <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-50">
                        <span>
                            {Object.entries(reactionCounts).map(([type, count]) =>
                                count > 0 ? `${({ Like: '👍', heart: '❤️', support: '🤝', sad: '😢' }[type] ?? '👍')} ${count} ` : ''
                            )}
                            · {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Comment list */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                    {comments.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-8">
                            No comments yet. Be the first to comment!
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                postId={post.id}
                                threadParentId={comment.id}
                                onSetReplyTarget={(target) => {
                                    setReplyTarget(target);
                                    inputRef.current?.focus();
                                }}
                                onDelete={(id) => {
                                    const updated = comments.filter((c) => c.id !== id);
                                    setComments(updated);
                                    syncToParent(updated);
                                }}
                                onUpdate={(id, body) => {
                                    const updated = comments.map((c) => c.id === id ? { ...c, body } : c);
                                    setComments(updated);
                                    syncToParent(updated);
                                }}
                                onRepliesUpdate={(cid, newReplies) => {
                                    const updated = comments.map((c) => c.id === cid ? { ...c, replies: newReplies } : c);
                                    setComments(updated);
                                    syncToParent(updated);
                                }}
                            />
                        ))
                    )}
                </div>

                {/* Input footer */}
                <div className="border-t border-gray-100 px-4 pt-3 pb-safe pb-4 bg-white">
                    {replyTarget && (
                        <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2 mb-2 text-xs">
                            <span>Replying to <strong className="text-blue-700">{replyTarget.name}</strong></span>
                            <button onClick={() => setReplyTarget(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                    )}
                    <form onSubmit={handleComment} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {user?.avatar
                                ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                : user?.name?.charAt(0).toUpperCase()
                            }
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={replyTarget ? `Reply to ${replyTarget.name}...` : 'Write a comment...'}
                                className="flex-1 bg-transparent text-sm outline-none"
                            />
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="text-blue-600 font-semibold text-sm disabled:text-gray-300 transition-colors"
                            >
                                {submitting ? '...' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(portal, document.body) : null;
}
