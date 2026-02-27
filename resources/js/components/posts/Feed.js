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
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchPosts = useCallback(
        async (isPolling = false) => {
            if (!isPolling) setLoading(true);
            try {
                const params = { page };
                if (search) params.search = search;
                const res = await api.get("/posts", { params });
                setPosts(res.data.data);
                setLastPage(res.data.last_page);
            } catch (e) {
                if (!isPolling && posts.length === 0) {
                    toast.error("Failed to load posts.");
                }
            } finally {
                if (!isPolling) setLoading(false);
                setInitialLoad(false);
            }
        },
        [page, search],
    );

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Poll for new posts every 60 seconds (silent background refresh)
    useEffect(() => {
        const interval = setInterval(() => fetchPosts(true), 60000);
        return () => clearInterval(interval);
    }, [fetchPosts]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="feed-container modern-feed">
            <div className="feed-header modern-feed-header">
                <h2 className="modern-feed-title">Community Feed</h2>
                <Link
                    to="/posts/create"
                    className="btn btn-primary modern-feed-newpost"
                >
                    <HiPlusCircle /> New Post
                </Link>
            </div>
            <div className="modern-feed-searchbar">
                <HiSearch className="modern-search-icon" />
                <input
                    type="text"
                    placeholder="Search posts..."
                    value={search}
                    onChange={handleSearchChange}
                    className="modern-search-input"
                />
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
                    <div className="posts-list modern-posts-list">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onUpdate={fetchPosts}
                            />
                        ))}
                    </div>
                    {lastPage > 1 && (
                        <div className="pagination modern-pagination">
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
