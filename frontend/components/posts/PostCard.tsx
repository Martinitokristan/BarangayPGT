'use client';

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { formatDistanceToNow, format } from 'date-fns';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ConfirmModal from "@/components/ui/ConfirmModal";
import api, { getStorageUrl } from "@/lib/api";
import {
    HiExclamation,
    HiChat,
    HiLink,
    HiClipboardList,
    HiLightBulb,
    HiSpeakerphone,
    HiDotsVertical,
    HiPencil,
    HiTrash,
    HiX,
    HiOutlineThumbUp,
    HiExternalLink
} from "react-icons/hi";
import { RiAlarmWarningFill, RiShieldStarFill } from "react-icons/ri";
import {
    FaFacebookF,
    FaFacebookMessenger,
    FaWhatsapp,
    FaTwitter,
    FaShare,
} from "react-icons/fa";
import CommentModal from "./CommentModal";

const REACTION_CONFIG: Record<string, any> = {
    Like: { emoji: "👍", label: "Like", color: "#3b5998", isGif: false },
    heart: { emoji: "❤️", label: "Heart", color: "#e74c3c", isGif: false },
    support: { emoji: "🤝", label: "Support", color: "#27ae60", isGif: false },
    sad: { emoji: "😢", label: "Sad", color: "#3498db", isGif: false },
};

const URGENCY_STYLES: Record<string, any> = {
    high: { label: "HIGH", className: "urgency-high" },
    medium: { label: "MEDIUM", className: "urgency-medium" },
    low: { label: "LOW", className: "urgency-low" },
};

const PURPOSE_LABELS: Record<string, any> = {
    complaint: { icon: <HiClipboardList />, text: "Complaint" },
    problem: { icon: <HiExclamation />, text: "Problem" },
    emergency: { icon: <RiAlarmWarningFill />, text: "Emergency" },
    suggestion: { icon: <HiLightBulb />, text: "Suggestion" },
    general: { icon: <HiSpeakerphone />, text: "General" },
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
};

export default function PostCard({ post, onUpdate, onDelete }: any) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [reactions, setReactions] = useState<any>(getInitialReactions(post));
    const [userReaction, setUserReaction] = useState<string | null>(getUserReaction(post));
    const [showPostMenu, setShowPostMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showImageViewer, setShowImageViewer] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const pressTimer = useRef<any>(null);
    const hoverTimeoutRef = useRef<any>(null);
    const shareTimeout = useRef<any>(null);

    function getInitialReactions(p: any) {
        if (p.reaction_counts) return p.reaction_counts;
        const counts: any = {};
        if (p.reactions) {
            p.reactions.forEach((r: any) => {
                counts[r.type] = (counts[r.type] || 0) + 1;
            });
        }
        return counts;
    }

    function getUserReaction(p: any) {
        if (p.user_reaction !== undefined) return p.user_reaction;
        if (p.reactions && user) {
            const r = p.reactions.find((r: any) => r.user_id === user.id);
            return r ? r.type : null;
        }
        return null;
    }

    // Use refs so the effect doesn't re-register listeners on every hover change
    const hoveredReactionRef = useRef<string | null>(null);
    hoveredReactionRef.current = hoveredReaction;
    const handleReactRef = useRef<(type: string) => void>(() => {});

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowPostMenu(false);
            }
            if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
                setShowShareMenu(false);
            }
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowReactionPicker(false);
                setHoveredReaction(null);
            }
        };

        const handleGlobalTouchMove = (e: TouchEvent) => {
            if (!showReactionPicker) return;
            if (e.cancelable) e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(
                touch.clientX,
                touch.clientY,
            );
            const reactionItem = element?.closest(".reaction-picker-item");
            if (reactionItem) {
                const type = reactionItem.getAttribute("data-type");
                setHoveredReaction(type);
            } else {
                setHoveredReaction(null);
            }
        };

        const handleGlobalTouchEnd = (e: TouchEvent) => {
            if (!showReactionPicker) return;
            if (hoveredReactionRef.current) {
                handleReactRef.current(hoveredReactionRef.current);
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
    }, [showReactionPicker]);

    const handleReact = async (type: string) => {
        try {
            const res = await api.post(`/posts/${post.id}/reactions`, { type });
            setReactions(res.data.reaction_counts || res.data.reactions);
            setUserReaction(res.data.user_reaction);
            if (onUpdate) {
                onUpdate(post.id, {
                    ...post,
                    reaction_counts: res.data.reaction_counts,
                    user_reaction: res.data.user_reaction
                });
            }
        } catch (e) {
            showToast("Failed to react. Please try again.", "error");
        }
        setShowReactionPicker(false);
    };
    handleReactRef.current = handleReact;

    const handleLikeClick = async () => {
        if (pressTimer.current === "long-press-triggered") return;
        const type = userReaction ? userReaction : "Like";
        handleReact(type);
    };

    const handlePressStart = (e: React.TouchEvent) => {
        pressTimer.current = setTimeout(() => {
            setShowReactionPicker(true);
            setHoveredReaction("Like");
            pressTimer.current = "long-press-triggered";
        }, 500);
    };

    const handlePressEnd = (e: React.TouchEvent) => {
        if (pressTimer.current) {
            if (pressTimer.current !== "long-press-triggered") {
                clearTimeout(pressTimer.current);
                handleLikeClick();
                pressTimer.current = null;
            }
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${post.id}`);
            showToast("Post deleted successfully.", "success");
            if (onDelete) onDelete(post.id);
            else if (onUpdate) onUpdate(post.id);
        } catch (e) {
            showToast("Failed to delete post.", "error");
        }
        setShowDeleteModal(false);
    };

    const getPostUrl = () => `${window.location.origin}/posts/${post.id}`;

    const handleSharePost = async () => {
        try {
            showToast("Post shared successfully to your profile!", "success");
            setShowShareMenu(false);
        } catch (e) {
            showToast("Failed to share post.", "error");
        }
    };

    const handleShare = (platform: string) => {
        const url = encodeURIComponent(getPostUrl());
        const text = encodeURIComponent(`${post.title} - Barangay Online Sumbongan`);
        const shareUrls: Record<string, string> = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            messenger: `https://www.facebook.com/dialog/send?link=${url}&app_id=0&redirect_uri=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
        };
        if (platform === "copy") {
            navigator.clipboard.writeText(getPostUrl());
            showToast("Link copied to clipboard!", "success");
        } else if (platform === "native" && navigator.share) {
            navigator.share({
                title: post.title,
                text: `${post.title} - Barangay Online Sumbongan`,
                url: getPostUrl(),
            }).catch(() => { });
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], "_blank", "width=600,height=400");
        }
        setShowShareMenu(false);
    };

    const handleMouseEnter = () => {
        if (window.innerWidth < 768) return;
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setShowReactionPicker(true);
        }, 500);
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setShowReactionPicker(false);
            setHoveredReaction(null);
        }, 100);
    };

    const handleShareMouseEnter = () => {
        clearTimeout(shareTimeout.current);
        setShowShareMenu(true);
    };

    const handleShareMouseLeave = () => {
        shareTimeout.current = setTimeout(() => setShowShareMenu(false), 300);
    };

    const isUrgent = post.urgency_level === "high" && post.status !== "resolved";
    const urgencyInfo = URGENCY_STYLES[post.urgency_level];
    const totalReactions = Object.values(reactions).reduce((a: any, b: any) => a + b, 0) as number;
    const isOwner = user?.id === post.user_id;
    const isAdmin = user?.role === "admin";
    const canManage = isOwner || isAdmin;

    const totalComments = post.comments_count !== undefined
        ? post.comments_count
        : (post.comments || []).reduce((acc: number, comment: any) => acc + 1 + (comment.replies?.length || 0), 0);

    return (
        <div className={`post-card ${isUrgent && isAdmin ? "post-urgent" : ""}`}>
            {isUrgent && isAdmin && (
                <div className="urgent-banner">
                    <HiExclamation /> URGENT POST
                </div>
            )}

            <div className="post-header">
                <div className="post-author">
                    <div className={`avatar ${isUrgent && isAdmin ? "avatar-urgent" : ""}`}>
                        {post.user?.avatar ? (
                            <img src={post.user.avatar} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            post.user?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <strong>
                            <Link href={`/users/${post.user?.id}/profile`} className="author-link">
                                {post.user?.name}
                            </Link>
                            <span className="author-purpose-tag">
                                {" · "}
                                {post.purpose && PURPOSE_LABELS[post.purpose]?.icon}{" "}
                                {post.purpose && PURPOSE_LABELS[post.purpose]?.text}
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
                        {isAdmin && post.status !== "resolved" && urgencyInfo && (
                            <span className={`badge-urgency ${urgencyInfo.className}`}>
                                {urgencyInfo.label}
                            </span>
                        )}
                        {post.status && (
                            <span className={`badge-status status-${post.status}`}>
                                {STATUS_LABELS[post.status]}
                            </span>
                        )}
                    </div>
                    {canManage && (
                        <div className="post-menu-wrapper" ref={menuRef}>
                            <button className="post-menu-btn" onClick={() => setShowPostMenu(!showPostMenu)}>
                                <HiDotsVertical />
                            </button>
                            {showPostMenu && (
                                <div className="post-menu-dropdown">
                                    <button onClick={() => { setShowPostMenu(false); router.push(`/posts/${post.id}/edit`); }}>
                                        <HiPencil /> Edit Post
                                    </button>
                                    <button className="menu-danger" onClick={() => { setShowPostMenu(false); setShowDeleteModal(true); }}>
                                        <HiTrash /> Delete Post
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="post-body">
                <h3><Link href={`/posts/${post.id}`}>{post.title}</Link></h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{post.body || post.description}</p>
                {post.image && (
                    <div className="post-image-wrapper" onClick={() => setShowImageViewer(true)}>
                        <img src={getStorageUrl(post.image)} alt="Post" className="post-image" />
                    </div>
                )}
            </div>

            {post.admin_response && (isOwner || isAdmin) && (
                <div className="admin-response">
                    <strong><RiShieldStarFill /> Admin Response:</strong>
                    <p>{post.admin_response}</p>
                </div>
            )}

            {totalComments > 0 && (
                <div className="post-stats-row">
                    <span />
                    <button className="comment-stat-count" onClick={() => setShowCommentModal(true)}>
                        {totalComments} {totalComments === 1 ? "comment" : "comments"}
                    </button>
                </div>
            )}

            <div className="post-action-bar">
                <div className="action-bar-item reaction-trigger">
                    <button
                        className={`action-bar-btn ${userReaction ? "reacted" : ""}`}
                        style={{ color: userReaction ? REACTION_CONFIG[userReaction]?.color : "inherit" }}
                        onClick={handleLikeClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        {userReaction ? (
                            <span className="action-bar-emoji">
                                {REACTION_CONFIG[userReaction].isGif ? (
                                    <img src={REACTION_CONFIG[userReaction].emoji} alt="emoji" style={{ width: '18px', height: '18px' }} />
                                ) : (
                                    REACTION_CONFIG[userReaction].emoji
                                )}
                            </span>
                        ) : (
                            <HiOutlineThumbUp />
                        )}
                        <span style={userReaction ? { fontWeight: "700" } : {}}>
                            {userReaction ? REACTION_CONFIG[userReaction].label : "Like"}
                        </span>
                    </button>

                    {showReactionPicker && (
                        <div className="reaction-picker" ref={pickerRef} onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }} onMouseLeave={handleMouseLeave}>
                            {Object.entries(REACTION_CONFIG).map(([key, config]) => (
                                <button
                                    key={key}
                                    data-type={key}
                                    className={`reaction-picker-item reaction-${key} ${userReaction === key ? "active" : ""} ${hoveredReaction === key ? "hovered" : ""}`}
                                    onClick={() => handleReact(key)}
                                    onMouseEnter={() => setHoveredReaction(key)}
                                    onMouseLeave={() => setHoveredReaction(null)}
                                >
                                    {hoveredReaction === key && <span className="reaction-tooltip">{config.label}</span>}
                                    <span className="reaction-picker-emoji">
                                        {config.isGif ? <img src={config.emoji} alt="" style={{ width: '24px', height: '24px' }} /> : config.emoji}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="action-bar-item">
                    <button className="action-bar-btn" onClick={() => setShowCommentModal(true)}>
                        <HiChat /><span>Comment</span>
                    </button>
                </div>

                <div className="action-bar-item share-trigger" ref={shareRef} onMouseEnter={handleShareMouseEnter} onMouseLeave={handleShareMouseLeave}>
                    <button className="action-bar-btn"><FaShare /><span>Share</span></button>
                    {showShareMenu && (
                        <div className="share-dropdown">
                            <button className="share-now-btn" onClick={handleSharePost}><FaShare /> Share now (Public)</button>
                            <button onClick={() => handleShare("copy")}><HiLink /> Copy Link</button>
                            <button onClick={() => handleShare("facebook")}><FaFacebookF /> Facebook</button>
                            <button onClick={() => handleShare("messenger")}><FaFacebookMessenger /> Messenger</button>
                            <button onClick={() => handleShare("whatsapp")}><FaWhatsapp /> WhatsApp</button>
                            <button onClick={() => handleShare("twitter")}><FaTwitter /> Twitter / X</button>
                            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                                <button onClick={() => handleShare("native")}><HiExternalLink /> More Options...</button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <CommentModal
                isOpen={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                post={post}
                user={user}
                toast={{ success: showToast, error: (msg: string) => showToast(msg, 'error') }}
                initialComments={post.comments || []}
                reactionsSummary={post.reaction_counts || {}}
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

            {showImageViewer && post.image && typeof document !== "undefined" && createPortal(
                <div className="image-lightbox-overlay" onClick={() => setShowImageViewer(false)}>
                    <button className="image-lightbox-close" onClick={() => setShowImageViewer(false)}><HiX /></button>
                    <img src={getStorageUrl(post.image)} alt="Post" className="image-lightbox-img" onClick={(e) => e.stopPropagation()} />
                </div>,
                document.body,
            )}
        </div>
    );
}
