import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { RiShieldStarFill } from "react-icons/ri";
import { HiChevronLeft, HiChevronRight, HiEye } from "react-icons/hi";

const STATUS_LABELS = {
    pending: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
};

export default function AdminPosts() {
    const toast = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        urgency_level: "",
        status: "",
        purpose: "",
        search: "",
    });
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page };
            Object.entries(filters).forEach(([key, val]) => {
                if (val) params[key] = val;
            });
            const res = await api.get("/posts", { params });
            setPosts(res.data.data);
            setLastPage(res.data.last_page);
        } catch (e) {
            toast.error("Failed to load posts.");
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const handleStatusChange = async (postId, status) => {
        try {
            await api.put(`/posts/${postId}`, { status });
            fetchPosts();
            toast.success("Status updated successfully!");
        } catch (e) {
            toast.error("Failed to update status.");
        }
    };

    return (
        <div className="admin-posts">
            <div className="dashboard-header">
                <h2>
                    <RiShieldStarFill /> Manage Posts
                </h2>
            </div>

            <div className="feed-filters">
                <input
                    type="text"
                    name="search"
                    placeholder="Search posts..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="search-input"
                />
                <select
                    name="urgency_level"
                    value={filters.urgency_level}
                    onChange={handleFilterChange}
                >
                    <option value="">All Urgency</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                </select>
                <select
                    name="purpose"
                    value={filters.purpose}
                    onChange={handleFilterChange}
                >
                    <option value="">All Types</option>
                    <option value="complaint">Complaint</option>
                    <option value="problem">Problem</option>
                    <option value="emergency">Emergency</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="general">General</option>
                </select>
            </div>

            {loading ? (
                <div className="loading-spinner">Loading...</div>
            ) : (
                <>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Author</th>
                                    <th>Purpose</th>
                                    <th>Urgency</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className={
                                            post.urgency_level === "high"
                                                ? "row-urgent"
                                                : ""
                                        }
                                    >
                                        <td>{post.id}</td>
                                        <td>
                                            <Link to={`/posts/${post.id}`}>
                                                {post.title}
                                            </Link>
                                        </td>
                                        <td>{post.user?.name}</td>
                                        <td>{post.purpose}</td>
                                        <td>
                                            <span
                                                className={`badge-urgency urgency-${post.urgency_level}`}
                                            >
                                                {post.urgency_level.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                value={post.status}
                                                onChange={(e) =>
                                                    handleStatusChange(
                                                        post.id,
                                                        e.target.value,
                                                    )
                                                }
                                                className={`status-select status-${post.status}`}
                                            >
                                                <option value="pending">
                                                    Pending
                                                </option>
                                                <option value="in_progress">
                                                    In Progress
                                                </option>
                                                <option value="resolved">
                                                    Resolved
                                                </option>
                                            </select>
                                        </td>
                                        <td>
                                            {new Date(
                                                post.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <Link
                                                to={`/posts/${post.id}`}
                                                className="btn btn-primary"
                                            >
                                                <HiEye /> View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {posts.length === 0 && (
                        <div className="empty-state">No posts found.</div>
                    )}

                    {lastPage > 1 && (
                        <div className="pagination">
                            <button
                                className="btn"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <HiChevronLeft /> Previous
                            </button>
                            <span>
                                Page {page} of {lastPage}
                            </span>
                            <button
                                className="btn"
                                disabled={page >= lastPage}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next <HiChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
