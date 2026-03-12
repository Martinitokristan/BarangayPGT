'use client';

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { HiX, HiReply, HiPencil, HiTrash, HiDotsHorizontal } from "react-icons/hi";
import api from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";

/* ===================== Comment Item ===================== */
export function CommentItem({
    comment,
    postId,
    user,
    toast,
    depth = 0,
    onDelete,
    onUpdate,
    onRepliesUpdate,
    threadParentId,
    onSetReplyTarget,
}: any) {
    const [showMenu, setShowMenu] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(comment.body);
    const [replies, setReplies] = useState<any[]>(comment.replies || []);
    const [showReplies, setShowReplies] = useState(false);
    const [likedBy, setLikedBy] = useState<number[]>(comment.liked_by || []);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isOwner = user?.id === comment.user_id;
    const isAdmin = user?.role === "admin";
    const canManage = isOwner || isAdmin;
    const userLiked = likedBy.includes(user?.id);

    const handleLike = async () => {
        try {
            const res = await api.post(`/posts/${postId}/comments/${comment.id}/like`);
            setLikedBy(res.data.liked_by);
        } catch (e) {
            toast.error("Failed to like comment.");
        }
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;
        try {
            await api.put(`/posts/${postId}/comments/${comment.id}`, {
                body: editText,
            });
            if (onUpdate) onUpdate(comment.id, editText);
            setEditing(false);
        } catch (e) {
            toast.error("Failed to update comment.");
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${postId}/comments/${comment.id}`);
            if (onDelete) onDelete(comment.id);
        } catch (e) {
            toast.error("Failed to delete comment.");
        }
        setShowDeleteModal(false);
    };

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "m";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return Math.floor(seconds) + "s";
    };

    return (
        <div className={`comment-item${depth > 0 ? " comment-reply" : ""}`}>
            <div className="comment-avatar">
                {comment.user?.avatar ? (
                    <img src={comment.user.avatar} alt="User avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    comment.user?.name?.charAt(0).toUpperCase()
                )}
            </div>
            <div className="comment-main">
                <div className="comment-bubble">
                    <div className="comment-bubble-inner">
                        <div className="comment-bubble-header">
                            <Link href={`/users/${comment.user?.id}/profile`} className="comment-author">
                                {comment.user?.name}
                            </Link>

                            {canManage && (
                                <div className="comment-menu-wrapper" ref={menuRef}>
                                    <button
                                        className="comment-menu-btn"
                                        onClick={() => setShowMenu(!showMenu)}
                                    >
                                        <HiDotsHorizontal />
                                    </button>
                                    {showMenu && (
                                        <div className="comment-menu-dropdown">
                                            {isOwner && (
                                                <button
                                                    onClick={() => {
                                                        setShowMenu(false);
                                                        setEditing(true);
                                                        setEditText(comment.body);
                                                    }}
                                                >
                                                    <HiPencil /> Edit
                                                </button>
                                            )}
                                            <button
                                                className="menu-danger"
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    setShowDeleteModal(true);
                                                }}
                                            >
                                                <HiTrash /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {editing ? (
                            <div className="comment-edit-form">
                                <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleEdit();
                                        if (e.key === "Escape") setEditing(false);
                                    }}
                                    autoFocus
                                />
                                <div className="comment-edit-actions">
                                    <button onClick={() => setEditing(false)}>Cancel</button>
                                    <button className="save" onClick={handleEdit}>Save</button>
                                </div>
                            </div>
                        ) : (
                            <p className="comment-text">{comment.body}</p>
                        )}
                    </div>
                </div>

                <div className="comment-actions-row">
                    <button
                        className={`comment-action-link ${userLiked ? "liked" : ""}`}
                        onClick={handleLike}
                    >
                        Like{likedBy.length > 0 && ` ${likedBy.length}`}
                    </button>
                    <button
                        className="comment-action-link"
                        disabled={replies.length >= 50}
                        onClick={() => onSetReplyTarget({
                            id: comment.id,
                            name: comment.user?.name,
                            threadParentId: threadParentId || comment.id,
                            depth: depth
                        })}
                    >
                        Reply
                    </button>
                    <span className="comment-timestamp">
                        {timeAgo(comment.created_at)}
                    </span>
                </div>

                {replies.length > 0 && depth === 0 && (
                    <div className="comment-replies-container">
                        {!showReplies ? (
                            <button className="show-replies-btn" onClick={() => setShowReplies(true)}>
                                <span className="reply-line"></span>
                                <HiReply className="reply-icon-rotate" />
                                View {replies.length} {replies.length === 1 ? "reply" : "replies"}
                            </button>
                        ) : (
                            <div className="nested-replies-list">
                                {replies.map((reply) => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        postId={postId}
                                        user={user}
                                        toast={toast}
                                        depth={depth + 1}
                                        threadParentId={threadParentId || comment.id}
                                        onSetReplyTarget={onSetReplyTarget}
                                        onDelete={(id: number) => {
                                            const updated = replies.filter((r) => r.id !== id);
                                            setReplies(updated);
                                            if (onRepliesUpdate) onRepliesUpdate(comment.id, updated);
                                        }}
                                        onUpdate={(id: number, newBody: string) => {
                                            const updated = replies.map((r) =>
                                                r.id === id ? { ...r, body: newBody } : r,
                                            );
                                            setReplies(updated);
                                            if (onRepliesUpdate) onRepliesUpdate(comment.id, updated);
                                        }}
                                    />
                                ))}
                                {replies.length < 50 && (
                                    <button
                                        className="reply-again-btn"
                                        onClick={() => onSetReplyTarget({
                                            id: comment.id,
                                            name: comment.user?.name,
                                            threadParentId: threadParentId || comment.id,
                                            depth: depth
                                        })}
                                    >
                                        Write a reply...
                                    </button>
                                )}
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

/* ===================== Comment Modal ===================== */
export default function CommentModal({
    isOpen,
    onClose,
    post,
    user,
    toast,
    initialComments = [],
    reactionsSummary = {},
    onUpdate,
}: any) {
    const [comments, setComments] = useState<any[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [replyTarget, setReplyTarget] = useState<any>(null);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartY = useRef(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        if (deltaY > 0) {
            setDragY(deltaY);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (dragY > 50) {
            onClose();
        } else {
            setDragY(0);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setDragY(0);
            setIsDragging(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
            document.body.classList.add("comment-modal-active");
            setComments(initialComments); // Reset to ensure accurate syncing when reopening
        } else {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
            document.body.classList.remove("comment-modal-active");
        }
        return () => {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
            document.body.classList.remove("comment-modal-active");
        };
    }, [isOpen, initialComments]);

    if (!isOpen) return null;

    const syncToParent = (updatedComments: any[]) => {
        if (onUpdate) {
            const total = updatedComments.reduce(
                (acc, c) => acc + 1 + (c.replies?.length || 0),
                0
            );
            onUpdate({
                ...post,
                comments: updatedComments,
                comments_count: total
            });
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const isReply = !!replyTarget;
            const mentionText = (isReply && replyTarget.depth > 0) ? `@${replyTarget.name} ` : "";

            const res = await api.post(`/posts/${post.id}/comments`, {
                body: mentionText + newComment,
                parent_id: isReply ? replyTarget.threadParentId : null,
            });

            let updated;
            if (isReply) {
                updated = comments.map(c => {
                    if (c.id === replyTarget.threadParentId) {
                        return { ...c, replies: [...(c.replies || []), res.data] };
                    }
                    return c;
                });
            } else {
                updated = [res.data, ...comments];
            }

            setComments(updated);
            syncToParent(updated);
            setNewComment("");
            setReplyTarget(null);
            if (!isReply && scrollRef.current) scrollRef.current.scrollTop = 0;
        } catch (e) {
            toast.error("Failed to post comment.");
        } finally {
            setSubmitting(false);
        }
    };

    const totalReactions = Object.values(reactionsSummary).reduce((a: any, b: any) => a + b, 0) as number;

    return ReactDOM.createPortal(
        <div className="comment-modal-backdrop" onClick={onClose}>
            <div
                className={`comment-modal-container ${isDragging ? 'dragging' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    transform: dragY > 0 ? `translateY(${dragY}px)` : '',
                    transition: isDragging ? 'none' : ''
                }}
            >
                <div
                    className="comment-modal-header"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="header-drag-handle"></div>
                    <span className="header-title">Comments</span>
                    <button className="close-btn" onClick={onClose}>
                        <HiX />
                    </button>
                </div>

                <div className="comment-modal-stats">
                    {totalReactions > 0 && (
                        <div className="stat-reactions">
                            <div className="reaction-icons">
                                {reactionsSummary.Like > 0 && <span>👍</span>}
                                {reactionsSummary.heart > 0 && <span>❤️</span>}
                                {reactionsSummary.support > 0 && <span>🤝</span>}
                                {reactionsSummary.sad > 0 && <span>😢</span>}
                            </div>
                            <span>{totalReactions} people reacted</span>
                        </div>
                    )}
                </div>

                <div className="comment-modal-body" ref={scrollRef}>
                    {comments.length === 0 ? (
                        <div className="empty-comments">
                            <p>No comments yet. Be the first to comment!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                postId={post.id}
                                user={user}
                                toast={toast}
                                threadParentId={comment.id}
                                onSetReplyTarget={(target: any) => {
                                    setReplyTarget(target);
                                    if (inputRef.current) inputRef.current.focus();
                                }}
                                onDelete={(id: number) => {
                                    const updated = comments.filter(c => c.id !== id);
                                    setComments(updated);
                                    syncToParent(updated);
                                }}
                                onUpdate={(id: number, body: string) => {
                                    const updated = comments.map(c => c.id === id ? { ...c, body } : c);
                                    setComments(updated);
                                    syncToParent(updated);
                                }}
                                onRepliesUpdate={(cid: number, newReplies: any[]) => {
                                    const updated = comments.map(c => c.id === cid ? { ...c, replies: newReplies } : c);
                                    setComments(updated);
                                    syncToParent(updated);
                                }}
                            />
                        ))
                    )}
                </div>

                <div className="comment-modal-footer">
                    {replyTarget && (
                        <div className="reply-indicator">
                            <span>Replying to <strong>{replyTarget.name}</strong></span>
                            <button onClick={() => setReplyTarget(null)}><HiX /></button>
                        </div>
                    )}
                    <form onSubmit={handleComment} className="comment-form">
                        <div className="form-avatar">
                            {user?.avatar ? (
                                <img src={user.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                            ) : (
                                user?.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTarget ? `Reply to ${replyTarget.name}...` : "Write a public comment..."}
                        />
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={submitting || !newComment.trim()}
                        >
                            {submitting ? "..." : "Post"}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
