import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import PostCard from "./PostCard";
import {
    HiPlusCircle,
    HiSearch,
    HiChevronLeft,
    HiChevronRight,
    HiUserCircle,
} from "react-icons/hi";

export default function Feed() {
    const { user } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [search, setSearch] = useState(searchParams.get("search") || "");
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

    useEffect(() => {
        const query = searchParams.get("search") || "";
        if (query !== search) {
            setSearch(query);
            setPage(1);
        }
    }, [searchParams]);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleCreatePostClick = () => {
        navigate("/posts/create");
    };

    const handleUpdatePost = (postId, updatedPost) => {
        if (!updatedPost) {
            // If no post provided, just re-fetch (for backward compatibility)
            fetchPosts();
            return;
        }
        setPosts((prevPosts) =>
            prevPosts.map((p) => (p.id === postId ? updatedPost : p)),
        );
    };

    const handleDeletePost = (postId) => {
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
    };

    return (
        <div className="feed-container modern-feed">
            {/* ... */}
            <div className="feed-header modern-feed-header">
                <h2 className="modern-feed-title">Community Feed</h2>
            </div>
            {/* ... */}
            <div className="create-post-bar" onClick={handleCreatePostClick}>
                <div className="bar-avatar">
                   <HiUserCircle />
                </div>
                <div className="bar-input">
                    What's on your mind, {user?.name?.split(' ')[0]}?
                </div>
            </div>

            {search && (
                <div className="active-search-indicator">
                    <span>Showing results for: <strong>"{search}"</strong></span>
                    <button onClick={() => {
                        setSearch("");
                        setSearchParams({});
                    }}>Clear</button>
                </div>
            )}
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
                                onUpdate={handleUpdatePost}
                                onDelete={() => handleDeletePost(post.id)}
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
