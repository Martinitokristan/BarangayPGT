import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
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
    HiX,
    HiOutlineThumbUp,
} from "react-icons/hi";
import { RiAlarmWarningFill, RiShieldStarFill } from "react-icons/ri";
import {
    FaFacebookF,
    FaFacebookMessenger,
    FaWhatsapp,
    FaTwitter,
    FaShare,
} from "react-icons/fa";
import "../../../sass/pages/_post-card.scss";
import CommentModal from "./CommentModal";

const REACTION_CONFIG = {
    like: { emoji: "👍", label: "Like", color: "#3b5998" },
    love: { emoji: "❤️", label: "Love", color: "#e74c3c" },
    haha: { emoji: "😆", label: "Haha", color: "#f1c40f" },
    wow: { emoji: "😮", label: "Wow", color: "#f39c12" },
    sad: { emoji: "😢", label: "Sad", color: "#3498db" },
    angry: { emoji: "😡", label: "Angry", color: "#c0392b" },
};

const URGENCY_STYLES = {
    high: { label: "HIGH", className: "urgency-high" },
    medium: { label: "MEDIUM", className: "urgency-medium" },
    low: { label: "LOW", className: "urgency-low" },
};

const PURPOSE_LABELS = {
    complaint: { icon: <HiClipboardList />, text: "Complaint" },
    problem: { icon: <HiExclamation />, text: "Problem" },
    emergency: { icon: <RiAlarmWarningFill />, text: "Emergency" },
    suggestion: { icon: <HiLightBulb />, text: "Suggestion" },
    general: { icon: <HiSpeakerphone />, text: "General" },
};

const STATUS_LABELS = {
    pending: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
};

/* ===================== PostCard ===================== */
export default function PostCard({ post, onUpdate, onDelete }) {
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [reactions, setReactions] = useState(getInitialReactions(post));
    const [userReaction, setUserReaction] = useState(getUserReaction(post));
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [hoveredReaction, setHoveredReaction] = useState(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showImageViewer, setShowImageViewer] = useState(false);

    const menuRef = useRef(null);
    const pickerRef = useRef(null);
    const shareRef = useRef(null);
    const reactionTimeout = useRef(null);
    const shareTimeout = useRef(null);
    const pressTimer = useRef(null);
    const showReactionTimer = useRef(null);
    const hoverTimeoutRef = useRef(null); // Added for reaction picker hover

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

    // Close menus on outside click and handle global touch tracking
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowPostMenu(false);
            }
            if (shareRef.current && !shareRef.current.contains(e.target)) {
                setShowShareMenu(false);
            }
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowReactionPicker(false);
                setHoveredReaction(null);
            }
        };

        const handleGlobalTouchMove = (e) => {
            if (!showReactionPicker) return;

            // Critical: Prevent page scroll during selection
            if (e.cancelable) e.preventDefault();

            const touch = e.touches[0];
            const element = document.elementFromPoint(
                touch.clientX,
                touch.clientY,
            );
            const reactionItem = element?.closest(".reaction-picker-item"); // Fixed selector
            if (reactionItem) {
                const type = reactionItem.getAttribute("data-type");
                setHoveredReaction(type);
            } else {
                setHoveredReaction(null);
            }
        };

        const handleGlobalTouchEnd = (e) => {
            if (!showReactionPicker) return;

            if (hoveredReaction) {
                handleReact(hoveredReaction); // Updated to handleReact
            }

            setShowReactionPicker(false);
            setHoveredReaction(null);
            pressTimer.current = null;
        };

        document.addEventListener("mousedown", handleClickOutside);

        if (showReactionPicker) {
            window.addEventListener("touchmove", handleGlobalTouchMove, {
                passive: false,
            });
            window.addEventListener("touchend", handleGlobalTouchEnd);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("touchmove", handleGlobalTouchMove);
            window.removeEventListener("touchend", handleGlobalTouchEnd);
        };
    }, [showReactionPicker, hoveredReaction]); // Re-run when picker/hover states change

    const handleReact = async (type) => {
        // Renamed from handleReaction
        try {
            const res = await api.post(`/posts/${post.id}/reactions`, { type });
            setReactions(res.data.reactions);
            setUserReaction(res.data.user_reaction);
        } catch (e) {
            toast.error("Failed to react. Please try again.");
        }
        setShowReactionPicker(false);
    };

    const handleLikeClick = async () => {
        // Renamed from handleQuickReaction
        if (pressTimer.current === "long-press-triggered") {
            // If long press was triggered, don't do quick reaction on mouse up
            return;
        }
        const type = userReaction ? userReaction : "like"; // Toggle off current OR add like
        try {
            const res = await api.post(`/posts/${post.id}/reactions`, { type });
            setReactions(res.data.reactions);
            setUserReaction(res.data.user_reaction);
        } catch (e) {
            toast.error("Failed to react. Please try again.");
        }
    };

    const handlePressStart = (e) => {
        // Start a timer for long press
        pressTimer.current = setTimeout(() => {
            setShowReactionPicker(true);
            setHoveredReaction("like"); // Start with "Like" hovered during long press
            pressTimer.current = "long-press-triggered";
        }, 500);
    };

    const handleTouchMove = (e) => {
        if (!showReactionPicker) return;

        // Prevent page scrolling while selecting reactions
        if (e.cancelable) {
            e.preventDefault();
        }

        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const reactionItem = element?.closest(".reaction-picker-item"); // Fixed selector
        if (reactionItem) {
            const type = reactionItem.getAttribute("data-type");
            setHoveredReaction(type);
        } else {
            setHoveredReaction(null);
        }
    };

    const handlePressEnd = (e) => {
        if (pressTimer.current) {
            if (pressTimer.current !== "long-press-triggered") {
                clearTimeout(pressTimer.current);
                handleLikeClick(); // Updated to handleLikeClick
                pressTimer.current = null;
            }
            // Long press release is handled by global touchend listener
        }
    };

    const handleDelete = async () => {
        // Renamed from handleDeletePost
        try {
            await api.delete(`/posts/${post.id}`);
            toast.success("Post deleted successfully.");
            if (onDelete) onDelete(post.id);
            else if (onUpdate) onUpdate();
        } catch (e) {
            toast.error("Failed to delete post.");
        }
        setShowDeleteModal(false);
    };

    const getPostUrl = () => `${window.location.origin}/posts/${post.id}`;

    const handleSharePost = async () => {
        try {
            // Internal share logic placeholder
            toast.success("Post shared successfully to your profile!");
            setShowShareMenu(false);
        } catch (e) {
            toast.error("Failed to share post.");
        }
    };

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

    const handleMouseEnter = () => {
        // Renamed from handleReactionMouseEnter
        if (window.innerWidth < 768) return; // Disable hover trigger on mobile
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setShowReactionPicker(true);
        }, 500); // 0.5 second delay for desktop
    };
    const handleMouseLeave = () => {
        // Renamed from handleReactionMouseLeave
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(
            () => {
                setShowReactionPicker(false);
                setHoveredReaction(null);
            },
            100, // Snap close on leave
        );
    };
    const handleShareMouseEnter = () => {
        clearTimeout(shareTimeout.current);
        setShowShareMenu(true);
    };
    const handleShareMouseLeave = () => {
        shareTimeout.current = setTimeout(() => setShowShareMenu(false), 300);
    };

    const isUrgent =
        post.urgency_level === "high" && post.status !== "resolved";
    const urgencyInfo = URGENCY_STYLES[post.urgency_level];
    const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);
    const isOwner = user?.id === post.user_id;
    const isAdmin = user?.role === "admin";
    const canManage = isOwner || isAdmin;

    // Use comments_count from server if available, otherwise calculate from local array
    const totalComments =
        post.comments_count !== undefined
            ? post.comments_count
            : (post.comments || []).reduce(
                  (acc, comment) => acc + 1 + (comment.replies?.length || 0),
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
                            <Link
                                to={`/users/${post.user?.id}/profile`}
                                className="author-link"
                            >
                                {post.user?.name}
                            </Link>
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
                        {isAdmin && post.status !== "resolved" && (
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
                    <div
                        className="post-image-wrapper"
                        onClick={() => setShowImageViewer(true)}
                    >
                        <img
                            src={`/storage/${post.image}`}
                            alt="Post"
                            className="post-image"
                        />
                    </div>
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
                        onClick={() => setShowCommentModal(true)}
                    >
                        {totalComments}{" "}
                        {totalComments === 1 ? "comment" : "comments"}
                    </button>
                </div>
            )}

            {/* Action Bar */}
            <div className="post-action-bar">
                <div className="action-bar-item reaction-trigger">
                    <button
                        className={`action-bar-btn ${userReaction ? "reacted" : ""}`}
                        style={{
                            color: userReaction
                                ? REACTION_CONFIG[userReaction]?.color
                                : "inherit",
                        }}
                        onClick={handleLikeClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {userReaction ? (
                            <span className="action-bar-emoji">
                                {REACTION_CONFIG[userReaction].emoji}
                            </span>
                        ) : (
                            <HiOutlineThumbUp />
                        )}
                        <span style={userReaction ? { fontWeight: "700" } : {}}>
                            {userReaction
                                ? REACTION_CONFIG[userReaction].label
                                : "Like"}
                        </span>
                    </button>

                    {showReactionPicker && (
                        <div
                            className="reaction-picker"
                            ref={pickerRef}
                            onMouseEnter={() => {
                                if (hoverTimeoutRef.current)
                                    clearTimeout(hoverTimeoutRef.current);
                            }}
                            onMouseLeave={handleMouseLeave}
                        >
                            {Object.entries(REACTION_CONFIG).map(
                                ([key, config]) => (
                                    <button
                                        key={key}
                                        data-type={key}
                                        className={`reaction-picker-item reaction-${key} ${userReaction === key ? "active" : ""} ${hoveredReaction === key ? "hovered" : ""}`}
                                        onClick={() => handleReact(key)}
                                        onMouseEnter={() =>
                                            setHoveredReaction(key)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredReaction(null)
                                        }
                                    >
                                        {hoveredReaction === key && (
                                            <span className="reaction-tooltip">
                                                {config.label}
                                            </span>
                                        )}
                                        <span className="reaction-picker-emoji">
                                            {config.emoji}
                                        </span>
                                    </button>
                                ),
                            )}
                        </div>
                    )}
                </div>

                <div className="action-bar-item">
                    <button
                        className="action-bar-btn"
                        onClick={() => setShowCommentModal(true)}
                    >
                        <HiChat />
                        <span>Comment</span>
                    </button>
                </div>

                <div
                    className="action-bar-item share-trigger"
                    ref={shareRef}
                    onMouseEnter={handleShareMouseEnter}
                    onMouseLeave={handleShareMouseLeave}
                >
                    <button className="action-bar-btn">
                        <FaShare />
                        <span>Share</span>
                    </button>
                    {showShareMenu && (
                        <div className="share-dropdown">
                            <button
                                className="share-now-btn"
                                onClick={handleSharePost}
                            >
                                <FaShare /> Share now (Public)
                            </button>
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

            {/* Comment Modal */}
            <CommentModal
                isOpen={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                post={post}
                user={user}
                toast={toast}
                initialComments={post.comments || []}
                reactionsSummary={post.reactions_summary || {}}
                onUpdate={onUpdate}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />

            {/* Image Lightbox */}
            {showImageViewer &&
                post.image &&
                ReactDOM.createPortal(
                    <div
                        className="image-lightbox-overlay"
                        onClick={() => setShowImageViewer(false)}
                    >
                        <button
                            className="image-lightbox-close"
                            onClick={() => setShowImageViewer(false)}
                            aria-label="Close"
                        >
                            <HiX />
                        </button>
                        <img
                            src={`/storage/${post.image}`}
                            alt="Post"
                            className="image-lightbox-img"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>,
                    document.body,
                )}
        </div>
    );
}
