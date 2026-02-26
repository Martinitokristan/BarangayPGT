import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import ConfirmModal from "../ui/ConfirmModal";
import api from "../../services/api";
import PostCard from "./PostCard";
import { RiShieldStarFill } from "react-icons/ri";
import {
    HiArrowLeft,
    HiChevronDown,
    HiChevronUp,
    HiCheckCircle,
} from "react-icons/hi";

export default function PostDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adminResponse, setAdminResponse] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [responding, setResponding] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [responseSubmitted, setResponseSubmitted] = useState(false);

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        try {
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
            setAdminResponse(res.data.admin_response || "");
            setNewStatus(res.data.status);
            // Only show the form open if there's no admin response yet
            if (!res.data.admin_response) {
                setShowAdminForm(true);
            }
        } catch (e) {
            toast.error("Failed to load post.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdminResponse = async (e) => {
        e.preventDefault();
        setResponding(true);
        try {
            const data = {};
            if (adminResponse) data.admin_response = adminResponse;
            if (newStatus) data.status = newStatus;
            await api.put(`/posts/${id}`, data);
            await fetchPost();
            setResponseSubmitted(true);
            setShowAdminForm(false);
            toast.success("Response submitted successfully!");
        } catch (e) {
            toast.error("Failed to submit response.");
        } finally {
            setResponding(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${id}`);
            toast.success("Post deleted successfully.");
            navigate("/");
        } catch (e) {
            toast.error("Failed to delete post.");
        }
        setShowDeleteModal(false);
    };

    if (loading) return <div className="loading-spinner">Loading post...</div>;
    if (!post) return <div className="empty-state">Post not found.</div>;

    const isAdmin = user?.role === "admin";

    return (
        <div className="post-detail-container">
            <button
                className="btn btn-sm btn-outline back-btn"
                onClick={() => navigate(-1)}
            >
                <HiArrowLeft /> Back
            </button>

            <PostCard post={post} onUpdate={fetchPost} />

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
                            {showAdminForm ? (
                                <HiChevronUp />
                            ) : (
                                <HiChevronDown />
                            )}
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
                                    onChange={(e) =>
                                        setNewStatus(e.target.value)
                                    }
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">
                                        In Progress
                                    </option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Admin Response</label>
                                <textarea
                                    rows={4}
                                    value={adminResponse}
                                    onChange={(e) =>
                                        setAdminResponse(e.target.value)
                                    }
                                    placeholder="Write response to the resident..."
                                />
                            </div>
                            <div className="admin-form-actions">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={responding}
                                >
                                    {responding
                                        ? "Saving..."
                                        : "Submit Response"}
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
