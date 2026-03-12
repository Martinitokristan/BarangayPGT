'use client';

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "./PostCard";
import {
    HiChevronLeft,
    HiChevronRight,
    HiUserCircle,
} from "react-icons/hi";

function FeedContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const postsRef = React.useRef<any[]>([]);
    postsRef.current = posts;

    const fetchPosts = useCallback(
        async (isPolling = false) => {
            if (!isPolling) setLoading(true);
            try {
                const params: any = { page };
                if (search) params.search = search;
                const res = await api.get("/posts", { params });
                setPosts(res.data.data);
                setLastPage(res.data.last_page);
            } catch (e) {
                if (!isPolling && postsRef.current.length === 0) {
                    showToast("Failed to load posts.", "error");
                }
            } finally {
                if (!isPolling) setLoading(false);
            }
        },
        [page, search, showToast],
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
    }, [searchParams, search]);

    const handleCreatePostClick = () => {
        router.push("/posts/create");
    };

    const handleUpdatePost = (postId?: number, updatedPost?: any) => {
        if (!updatedPost) {
            // If no post provided, just re-fetch (for backward compatibility)
            fetchPosts();
            return;
        }
        setPosts((prevPosts) =>
            prevPosts.map((p) => (p.id === postId ? updatedPost : p)),
        );
    };

    const handleDeletePost = (postId: number) => {
        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));
    };

    return (
        <div className="feed-container modern-feed">
            <div className="feed-header modern-feed-header">
            </div>

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
                        router.push("/");
                    }}>Clear</button>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner">Loading posts...</div>
            ) : posts.length === 0 ? (
                <div className="empty-state">
                    <p>No posts found. Be the first to post!</p>
                    <Link href="/posts/create" className="btn btn-primary">
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

export default function Feed() {
    return (
        <Suspense fallback={<div className="loading-spinner">Loading feed...</div>}>
            <FeedContent />
        </Suspense>
    );
}
