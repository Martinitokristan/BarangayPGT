'use client';

// Interactive layer for the Post Detail page.
// The server already fetched `initialPost`; this component handles:
//   - Admin response form (status + text)
//   - Delete confirmation modal
//   - Passing the post to PostCard which handles likes/comments
// If the admin takes action, we re-fetch locally to reflect the update.

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import api from '@/lib/api';
import PostCard from './PostCard';
import { RiShieldStarFill } from 'react-icons/ri';
import { HiArrowLeft, HiChevronDown, HiChevronUp, HiCheckCircle } from 'react-icons/hi';

interface Props {
    initialPost: any;
    postId: string;
}

export default function PostDetailClient({ initialPost, postId }: Props) {
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [post, setPost] = useState<any>(initialPost);
    const [loading, setLoading] = useState(!initialPost);
    const [adminResponse, setAdminResponse] = useState(initialPost?.admin_response || '');
    const [newStatus, setNewStatus] = useState(initialPost?.status || '');
    const [responding, setResponding] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAdminForm, setShowAdminForm] = useState(!initialPost?.admin_response);
    const [responseSubmitted, setResponseSubmitted] = useState(false);

    // Fetch on mount if no initial data (pure client-side navigation)
    useEffect(() => {
        if (!initialPost) {
            fetchPost();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/posts/${postId}`);
            setPost(res.data);
            setAdminResponse(res.data.admin_response || '');
            setNewStatus(res.data.status || '');
            setShowAdminForm(!res.data.admin_response);
        } catch {
            showToast('Post not found.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const refetchPost = async () => {
        try {
            const res = await api.get(`/posts/${postId}`);
            setPost(res.data);
            setAdminResponse(res.data.admin_response || '');
            setNewStatus(res.data.status);
        } catch {
            showToast('Failed to reload post.', 'error');
        }
    };

    const handleAdminResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        setResponding(true);
        try {
            const data: any = {};
            if (adminResponse) data.admin_response = adminResponse;
            if (newStatus) data.status = newStatus;
            await api.put(`/posts/${postId}`, data);
            await refetchPost();
            setResponseSubmitted(true);
            setShowAdminForm(false);
            showToast('Response submitted successfully!', 'success');
        } catch {
            showToast('Failed to submit response.', 'error');
        } finally {
            setResponding(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${postId}`);
            showToast('Post deleted successfully.', 'success');
            router.push('/');
        } catch {
            showToast('Failed to delete post.', 'error');
        }
        setShowDeleteModal(false);
    };

    const isAdmin = user?.role === 'admin';

    if (loading) {
        return (
            <div className="post-detail-container">
                <div className="feed-loading-skeleton">
                    <div className="skeleton-card">
                        <div className="skeleton-header">
                            <div className="skeleton-avatar" />
                            <div className="skeleton-lines">
                                <div className="skeleton-line short" />
                                <div className="skeleton-line shorter" />
                            </div>
                        </div>
                        <div className="skeleton-body">
                            <div className="skeleton-line" />
                            <div className="skeleton-line" />
                            <div className="skeleton-line medium" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="post-detail-container">
                <div className="empty-state">Post not found.</div>
            </div>
        );
    }

    return (
        <div className="post-detail-container">
            <button
                className="btn btn-sm btn-outline back-btn"
                onClick={() => router.back()}
            >
                <HiArrowLeft /> Back
            </button>

            <PostCard post={post} onUpdate={refetchPost} />

            {/* Admin response form */}
            {isAdmin && (
                <div className="admin-panel">
                    <div
                        className="admin-panel-header"
                        onClick={() => {
                            setShowAdminForm(!showAdminForm);
                            setResponseSubmitted(false);
                        }}
                    >
                        <h3>
                            <RiShieldStarFill /> Admin Actions
                        </h3>
                        <button className="btn btn-sm btn-ghost">
                            {showAdminForm ? <HiChevronUp /> : <HiChevronDown />}
                        </button>
                    </div>

                    {responseSubmitted && !showAdminForm && (
                        <div className="response-success-banner">
                            <HiCheckCircle />
                            <span>Response submitted successfully!</span>
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={() => {
                                    setShowAdminForm(true);
                                    setResponseSubmitted(false);
                                }}
                            >
                                Edit Response
                            </button>
                        </div>
                    )}

                    {showAdminForm && (
                        <form onSubmit={handleAdminResponse}>
                            <div className="form-group">
                                <label>Update Status</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Admin Response</label>
                                <textarea
                                    rows={4}
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder="Write response to the resident..."
                                />
                            </div>
                            <div className="admin-form-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={responding}
                                >
                                    {responding ? 'Saving...' : 'Submit Response'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowAdminForm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Post"
                message="Are you sure you want to delete this post? All comments and reactions will be permanently removed."
                confirmText="Delete Post"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
