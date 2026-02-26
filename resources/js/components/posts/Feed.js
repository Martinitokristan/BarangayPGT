import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import PostCard from "./PostCard";
import {
    HiPlusCircle,
    HiSearch,
    HiChevronLeft,
    HiChevronRight,
} from "react-icons/hi";

export default function Feed() {
    const toast = useToast();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [filters, setFilters] = useState({
        urgency_level: "",
        status: "",
        purpose: "",
        search: "",
    });
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchPosts = useCallback(
        async (isPolling = false) => {
            if (!isPolling) setLoading(true);
            try {
                const params = { page };
                Object.entries(filters).forEach(([key, val]) => {
                    if (val) params[key] = val;
                });
                const res = await api.get("/posts", { params });
                setPosts(res.data.data);
                setLastPage(res.data.last_page);
            } catch (e) {
                // Silently fail on poll, show error on initial load
                if (!isPolling && posts.length === 0) {
                    toast.error("Failed to load posts.");
                }
            } finally {
                if (!isPolling) setLoading(false);
                setInitialLoad(false);
            }
        },
        [page, filters],
    );

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Poll for new posts every 60 seconds (silent background refresh)
    useEffect(() => {
        const interval = setInterval(() => fetchPosts(true), 60000);
        return () => clearInterval(interval);
    }, [fetchPosts]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    return (
        <div className="feed-container">
            <div className="feed-header">
                <h2>Community Feed</h2>
                <Link to="/posts/create" className="btn btn-primary">
                    <HiPlusCircle /> New Post
                </Link>
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
                <div className="loading-spinner">Loading posts...</div>
            ) : posts.length === 0 ? (
                <div className="empty-state">
                    <p>No posts found. Be the first to post!</p>
                    <Link to="/posts/create" className="btn btn-primary">
                        Create a Post
                    </Link>
                </div>
            ) : (
                <>
                    <div className="posts-list">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onUpdate={fetchPosts}
                            />
                        ))}
                    </div>
                    {lastPage > 1 && (
                        <div className="pagination">
                            <button
                                className="btn btn-sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <HiChevronLeft /> Previous
                            </button>
                            <span>
                                Page {page} of {lastPage}
                            </span>
                            <button
                                className="btn btn-sm"
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
