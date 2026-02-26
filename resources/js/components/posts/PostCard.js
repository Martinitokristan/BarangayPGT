import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../ui/ConfirmModal";
import api from "../../services/api";
import {
    HiExclamation,
    HiChat,
    HiLink,
    HiClipboardList,
    HiLightBulb,
    HiSpeakerphone,
    HiDotsVertical,
    HiDotsHorizontal,
    HiPencil,
    HiTrash,
    HiShare,
    HiExternalLink,
    HiReply,
} from "react-icons/hi";
import {
    FaFacebookF,
    FaFacebookMessenger,
    FaTwitter,
    FaWhatsapp,
} from "react-icons/fa";
import { RiAlarmWarningFill, RiShieldStarFill } from "react-icons/ri";

const REACTION_CONFIG = {
    like: { emoji: "\uD83D\uDC4D", label: "Like" },
    support: { emoji: "\uD83E\uDD1D", label: "Support" },
    urgent: { emoji: "\uD83D\uDEA8", label: "Urgent" },
    sad: { emoji: "\uD83D\uDE22", label: "Sad" },
    angry: { emoji: "\uD83D\uDE21", label: "Angry" },
};

const URGENCY_STYLES = {
    high: { label: "HIGH", className: "urgency-high" },
    medium: { label: "MEDIUM", className: "urgency-medium" },
    low: { label: "LOW", className: "urgency-low" },
};

const STATUS_LABELS = {
    pending: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
};

const PURPOSE_LABELS = {
    complaint: { icon: <HiClipboardList />, text: "Complaint" },
    problem: { icon: <HiExclamation />, text: "Problem" },
    emergency: { icon: <RiAlarmWarningFill />, text: "Emergency" },
    suggestion: { icon: <HiLightBulb />, text: "Suggestion" },
    general: { icon: <HiSpeakerphone />, text: "General" },
};

/* ===================== Comment Item ===================== */
function CommentItem({
    comment,
    postId,
    user,
    toast,
    depth = 0,
    onDelete,
    onUpdate,
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(comment.body);
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replies, setReplies] = useState(comment.replies || []);
    const [showReplies, setShowReplies] = useState(false);
    const [likedBy, setLikedBy] = useState(comment.liked_by || []);
    const [submittingReply, setSubmittingReply] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const menuRef = useRef(null);

    const isOwner = user?.id === comment.user_id;
    const isAdmin = user?.role === "admin";
    const canManage = isOwner || isAdmin;
    const userLiked = user ? likedBy.includes(user.id) : false;

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target))
                setShowMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLike = async () => {
        try {
            const res = await api.post(
                `/posts/${postId}/comments/${comment.id}/like`,
            );
            setLikedBy(res.data.liked_by);
        } catch {
            toast.error("Failed to like comment.");
        }
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;
        try {
            const res = await api.put(
                `/posts/${postId}/comments/${comment.id}`,
                { body: editText },
            );
            onUpdate(comment.id, res.data.body);
            setEditing(false);
            toast.success("Comment updated.");
        } catch {
            toast.error("Failed to update comment.");
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${postId}/comments/${comment.id}`);
            onDelete(comment.id);
            setShowDeleteModal(false);
            toast.success("Comment deleted.");
        } catch {
            toast.error("Failed to delete comment.");
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setSubmittingReply(true);
        try {
            const res = await api.post(`/posts/${postId}/comments`, {
                body: replyText,
                parent_id: comment.id,
            });
            setReplies([...replies, res.data]);
            setReplyText("");
            setReplyOpen(false);
            setShowReplies(true);
            toast.success("Reply posted!");
        } catch {
            toast.error("Failed to post reply.");
        } finally {
            setSubmittingReply(false);
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "Just now";
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className={`comment-item ${depth > 0 ? "comment-reply" : ""}`}>
            <div className="comment-avatar">
                {comment.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="comment-content">
                <div className="comment-bubble">
                    <div className="comment-bubble-header">
                        <strong>{comment.user?.name}</strong>
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
                                <button onClick={() => setEditing(false)}>
                                    Cancel
                                </button>
                                <button className="save" onClick={handleEdit}>
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p>{comment.body}</p>
                    )}
                </div>

                <div className="comment-actions-row">
                    <button
                        className={`comment-action-link ${userLiked ? "liked" : ""}`}
                        onClick={handleLike}
                    >
                        Like{likedBy.length > 0 && ` (${likedBy.length})`}
                    </button>
                    {depth === 0 && (
                        <button
                            className="comment-action-link"
                            onClick={() => setReplyOpen(!replyOpen)}
                        >
                            Reply
                        </button>
                    )}
                    <span className="comment-timestamp">
                        {timeAgo(comment.created_at)}
                    </span>
                </div>

                {/* Reply input */}
                {replyOpen && (
                    <form onSubmit={handleReply} className="reply-form">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${comment.user?.name}...`}
                            maxLength={1000}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="btn btn-sm btn-primary"
                            disabled={submittingReply}
                        >
                            {submittingReply ? "..." : <HiReply />}
                        </button>
                    </form>
                )}

                {/* Show replies toggle */}
                {replies.length > 0 && depth === 0 && (
                    <>
                        {!showReplies && (
                            <button
                                className="show-replies-btn"
                                onClick={() => setShowReplies(true)}
                            >
                                <HiReply /> {replies.length}{" "}
                                {replies.length === 1 ? "reply" : "replies"}
                            </button>
                        )}
                        {showReplies &&
                            replies.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    postId={postId}
                                    user={user}
                                    toast={toast}
                                    depth={depth + 1}
                                    onDelete={(id) =>
                                        setReplies(
                                            replies.filter((r) => r.id !== id),
                                        )
                                    }
                                    onUpdate={(id, newBody) =>
                                        setReplies(
                                            replies.map((r) =>
                                                r.id === id
                                                    ? { ...r, body: newBody }
                                                    : r,
                                            ),
                                        )
                                    }
                                />
                            ))}
                    </>
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

/* ===================== PostCard ===================== */
export default function PostCard({ post, onUpdate }) {
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(post.comments || []);
    const [newComment, setNewComment] = useState("");
    const [reactions, setReactions] = useState(getInitialReactions(post));
    const [userReaction, setUserReaction] = useState(getUserReaction(post));
    const [submitting, setSubmitting] = useState(false);
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const menuRef = useRef(null);
    const reactionRef = useRef(null);
    const shareRef = useRef(null);
    const reactionTimeout = useRef(null);
    const shareTimeout = useRef(null);

    function getInitialReactions(post) {
        const counts = {};
        if (post.reactions) {
            post.reactions.forEach((r) => {
                counts[r.type] = (counts[r.type] || 0) + 1;
            });
        }
        return counts;
    }

    function getUserReaction(post) {
        if (post.reactions && user) {
            const r = post.reactions.find((r) => r.user_id === user.id);
            return r ? r.type : null;
        }
        return null;
    }

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowPostMenu(false);
            }
            if (shareRef.current && !shareRef.current.contains(e.target)) {
                setShowShareMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleReaction = async (type) => {
        try {
            const res = await api.post(`/posts/${post.id}/reactions`, { type });
            setReactions(res.data.reactions);
            setUserReaction(res.data.user_reaction);
        } catch (e) {
            toast.error("Failed to react. Please try again.");
        }
        setShowReactionPicker(false);
    };

    const handleQuickReaction = async () => {
        const type = userReaction ? userReaction : "like";
        try {
            const res = await api.post(`/posts/${post.id}/reactions`, { type });
            setReactions(res.data.reactions);
            setUserReaction(res.data.user_reaction);
        } catch (e) {
            toast.error("Failed to react. Please try again.");
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/posts/${post.id}/comments`, {
                body: newComment,
            });
            setComments([res.data, ...comments]);
            setNewComment("");
        } catch (e) {
            toast.error("Failed to post comment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = async () => {
        try {
            await api.delete(`/posts/${post.id}`);
            toast.success("Post deleted successfully.");
            if (onUpdate) onUpdate();
        } catch (e) {
            toast.error("Failed to delete post.");
        }
        setShowDeleteModal(false);
    };

    const getPostUrl = () => `${window.location.origin}/posts/${post.id}`;

    const handleShare = (platform) => {
        const url = encodeURIComponent(getPostUrl());
        const text = encodeURIComponent(
            `${post.title} - Barangay Online Sumbongan`,
        );
        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            messenger: `https://www.facebook.com/dialog/send?link=${url}&app_id=0&redirect_uri=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
        };
        if (platform === "copy") {
            navigator.clipboard.writeText(getPostUrl());
            toast.success("Link copied to clipboard!");
        } else if (platform === "native" && navigator.share) {
            navigator
                .share({
                    title: post.title,
                    text: `${post.title} - Barangay Online Sumbongan`,
                    url: getPostUrl(),
                })
                .catch(() => {});
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], "_blank", "width=600,height=400");
        }
        setShowShareMenu(false);
    };

    const handleReactionMouseEnter = () => {
        clearTimeout(reactionTimeout.current);
        setShowReactionPicker(true);
    };
    const handleReactionMouseLeave = () => {
        reactionTimeout.current = setTimeout(
            () => setShowReactionPicker(false),
            400,
        );
    };
    const handleShareMouseEnter = () => {
        clearTimeout(shareTimeout.current);
        setShowShareMenu(true);
    };
    const handleShareMouseLeave = () => {
        shareTimeout.current = setTimeout(() => setShowShareMenu(false), 300);
    };

    const isUrgent = post.urgency_level === "high";
    const urgencyInfo = URGENCY_STYLES[post.urgency_level];
    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);
    const isOwner = user?.id === post.user_id;
    const isAdmin = user?.role === "admin";
    const canManage = isOwner || isAdmin;
    const totalComments = comments.reduce(
        (sum, c) => sum + 1 + (c.replies?.length || 0),
        0,
    );

    return (
        <div
            className={`post-card ${isUrgent && isAdmin ? "post-urgent" : ""}`}
        >
            {isUrgent && isAdmin && (
                <div className="urgent-banner">
                    <HiExclamation /> URGENT POST
                </div>
            )}

            <div className="post-header">
                <div className="post-author">
                    <div
                        className={`avatar ${isUrgent && isAdmin ? "avatar-urgent" : ""}`}
                    >
                        {post.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <strong>
                            {post.user?.name}
                            <span className="author-purpose-tag">
                                {" · "}
                                {PURPOSE_LABELS[post.purpose]?.icon}{" "}
                                {PURPOSE_LABELS[post.purpose]?.text}
                            </span>
                        </strong>
                        <span className="post-time">
                            {new Date(post.created_at).toLocaleString()}
                            {isUrgent && isAdmin && (
                                <span className="time-urgent-label">
                                    <HiExclamation /> Urgent
                                </span>
                            )}
                        </span>
                    </div>
                </div>
                <div className="post-header-right">
                    <div className="post-meta">
                        {isAdmin && (
                            <span
                                className={`badge-urgency ${urgencyInfo.className}`}
                            >
                                {urgencyInfo.label}
                            </span>
                        )}
                        <span className={`badge-status status-${post.status}`}>
                            {STATUS_LABELS[post.status]}
                        </span>
                    </div>
                    {canManage && (
                        <div className="post-menu-wrapper" ref={menuRef}>
                            <button
                                className="post-menu-btn"
                                onClick={() => setShowPostMenu(!showPostMenu)}
                            >
                                <HiDotsVertical />
                            </button>
                            {showPostMenu && (
                                <div className="post-menu-dropdown">
                                    <button
                                        onClick={() => {
                                            setShowPostMenu(false);
                                            navigate(`/posts/${post.id}/edit`);
                                        }}
                                    >
                                        <HiPencil /> Edit Post
                                    </button>
                                    <button
                                        className="menu-danger"
                                        onClick={() => {
                                            setShowPostMenu(false);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <HiTrash /> Delete Post
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="post-body">
                <h3>
                    <Link to={`/posts/${post.id}`}>{post.title}</Link>
                </h3>
                <p>{post.description}</p>
                {post.image && (
                    <img
                        src={`/storage/${post.image}`}
                        alt="Post"
                        className="post-image"
                    />
                )}
            </div>

            {post.admin_response && (isOwner || isAdmin) && (
                <div className="admin-response">
                    <strong>
                        <RiShieldStarFill /> Admin Response:
                    </strong>
                    <p>{post.admin_response}</p>
                </div>
            )}

            {/* Comment count row */}
            {totalComments > 0 && (
                <div className="post-stats-row">
                    <span />
                    <button
                        className="comment-stat-count"
                        onClick={() => setShowComments(!showComments)}
                    >
                        {totalComments}{" "}
                        {totalComments === 1 ? "comment" : "comments"}
                    </button>
                </div>
            )}

            {/* Action Bar */}
            <div className="post-action-bar">
                <div
                    className="action-bar-item reaction-trigger"
                    ref={reactionRef}
                    onMouseEnter={handleReactionMouseEnter}
                    onMouseLeave={handleReactionMouseLeave}
                >
                    <button
                        className={`action-bar-btn ${userReaction ? "reacted" : ""}`}
                        onClick={handleQuickReaction}
                    >
                        <span className="action-bar-emoji">
                            {userReaction
                                ? REACTION_CONFIG[userReaction]?.emoji
                                : "\uD83D\uDC4D"}
                        </span>
                        <span>
                            {totalReactions > 0 ? totalReactions : "Like"}
                        </span>
                    </button>

                    {showReactionPicker && (
                        <div className="reaction-picker">
                            {Object.entries(REACTION_CONFIG).map(
                                ([type, config]) => (
                                    <button
                                        key={type}
                                        className={`reaction-picker-item ${userReaction === type ? "active" : ""}`}
                                        onClick={() => handleReaction(type)}
                                    >
                                        <span className="reaction-picker-emoji">
                                            {config.emoji}
                                        </span>
                                        <span className="reaction-picker-label">
                                            {config.label}
                                        </span>
                                    </button>
                                ),
                            )}
                        </div>
                    )}
                </div>

                <button
                    className="action-bar-btn"
                    onClick={() => setShowComments(!showComments)}
                >
                    <HiChat />
                    <span>Comment</span>
                </button>

                <div
                    className="action-bar-item share-trigger"
                    ref={shareRef}
                    onMouseEnter={handleShareMouseEnter}
                    onMouseLeave={handleShareMouseLeave}
                >
                    <button className="action-bar-btn">
                        <HiShare />
                        <span>Share</span>
                    </button>
                    {showShareMenu && (
                        <div className="share-dropdown">
                            <button onClick={() => handleShare("copy")}>
                                <HiLink /> Copy Link
                            </button>
                            <button onClick={() => handleShare("facebook")}>
                                <FaFacebookF /> Facebook
                            </button>
                            <button onClick={() => handleShare("messenger")}>
                                <FaFacebookMessenger /> Messenger
                            </button>
                            <button onClick={() => handleShare("whatsapp")}>
                                <FaWhatsapp /> WhatsApp
                            </button>
                            <button onClick={() => handleShare("twitter")}>
                                <FaTwitter /> Twitter / X
                            </button>
                            {navigator.share && (
                                <button onClick={() => handleShare("native")}>
                                    <HiExternalLink /> More Options...
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="comments-section">
                    <form onSubmit={handleComment} className="comment-form">
                        <div className="comment-form-avatar">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            maxLength={1000}
                        />
                        <button
                            type="submit"
                            className="btn btn-sm btn-primary"
                            disabled={submitting || !newComment.trim()}
                        >
                            {submitting ? "..." : "Post"}
                        </button>
                    </form>
                    <div className="comments-list">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                postId={post.id}
                                user={user}
                                toast={toast}
                                onDelete={(id) =>
                                    setComments(
                                        comments.filter((c) => c.id !== id),
                                    )
                                }
                                onUpdate={(id, newBody) =>
                                    setComments(
                                        comments.map((c) =>
                                            c.id === id
                                                ? { ...c, body: newBody }
                                                : c,
                                        ),
                                    )
                                }
                            />
                        ))}
                        {comments.length === 0 && (
                            <p className="no-comments">
                                No comments yet. Be the first to comment!
                            </p>
                        )}
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Post"
                message="Are you sure you want to delete this post? All comments and reactions will be permanently removed."
                confirmText="Delete Post"
                variant="danger"
                onConfirm={handleDeletePost}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
