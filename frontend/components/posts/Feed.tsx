'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Post {
    id: number;
    body: string | null;
    image: string | null;
    type: string;
    user: {
        id: number;
        name: string;
        avatar: string | null;
        barangay?: { name: string };
    };
    user_reaction: string | null;
    reaction_counts: Record<string, number>;
    comments_count: number;
    is_owner: boolean;
    created_at: string;
}

const REACTION_EMOJIS: Record<string, string> = {
    like: '👍', love: '❤️', haha: '😂', wow: '😮', sad: '😢', angry: '😡',
};

// ─── Feed Page ────────────────────────────────────────────────────────────────

export default function Feed() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [posting, setPosting] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchPosts = async (p = 1) => {
        try {
            const res = await api.get(`/posts?page=${p}`);
            const data = res.data;
            if (p === 1) {
                setPosts(data.data);
            } else {
                setPosts((prev) => [...prev, ...data.data]);
            }
            setHasMore(!!data.next_page_url);
        } catch {
            showToast('Failed to load posts.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(1); }, []);

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim()) return;
        setPosting(true);
        try {
            const res = await api.post('/posts', { body: newPost });
            const created: Post = {
                ...res.data,
                user_reaction: null,
                reaction_counts: {},
                comments_count: 0,
                is_owner: true,
            };
            setPosts((prev) => [created, ...prev]);
            setNewPost('');
            showToast('Post created!', 'success');
        } catch {
            showToast('Failed to create post.', 'error');
        } finally {
            setPosting(false);
        }
    };

    const handleReact = async (post: Post, type: string) => {
        try {
            const res = await api.post(`/posts/${post.id}/reactions`, { type });
            const { user_reaction, reaction_counts } = res.data;
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id ? { ...p, user_reaction, reaction_counts } : p
                )
            );
        } catch {
            showToast('Failed to react.', 'error');
        }
    };

    const handleDelete = async (postId: number) => {
        if (!confirm('Delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}`);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            showToast('Post deleted.', 'success');
        } catch {
            showToast('Failed to delete post.', 'error');
        }
    };

    const totalReactions = (post: Post) =>
        Object.values(post.reaction_counts).reduce((a, b) => a + b, 0);

    return (
        <div className="max-w-2xl mx-auto">
            {/* Create post */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {user?.avatar
                            ? <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            : user?.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <form onSubmit={handlePost} className="flex-1">
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        />
                        <div className="flex items-center justify-end mt-2">
                            <button
                                type="submit"
                                disabled={posting || !newPost.trim()}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-all"
                            >
                                {posting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Posts */}
            {loading ? (
                <div className="text-center text-gray-400 py-16 text-sm">Loading posts...</div>
            ) : posts.length === 0 ? (
                <div className="text-center text-gray-400 py-16 text-sm">No posts yet. Be the first to post!</div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Post header */}
                            <div className="flex items-start gap-3 p-5 pb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                    {post.user.avatar
                                        ? <img src={post.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        : post.user.name.charAt(0).toUpperCase()
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{post.user.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {post.user.barangay?.name && `${post.user.barangay.name} · `}
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {post.is_owner && (
                                    <button onClick={() => handleDelete(post.id)}
                                        className="text-gray-400 hover:text-red-500 text-xs p-1 rounded-lg hover:bg-red-50 transition-colors">
                                        Delete
                                    </button>
                                )}
                            </div>

                            {/* Post body */}
                            {post.body && (
                                <p className="px-5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.body}</p>
                            )}

                            {/* Post image */}
                            {post.image && (
                                <img src={post.image} alt="Post" className="w-full mt-3 object-cover max-h-96" />
                            )}

                            {/* Reaction counts */}
                            {totalReactions(post) > 0 && (
                                <div className="px-5 pt-3 pb-1">
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        {Object.entries(post.reaction_counts).map(([type, count]) => (
                                            <span key={type}>{REACTION_EMOJIS[type]} {count}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="border-t border-gray-100 mt-3 px-5 py-2 flex items-center gap-2">
                                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                                    <button
                                        key={type}
                                        onClick={() => handleReact(post, type)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-gray-50 ${post.user_reaction === type ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500'
                                            }`}
                                        title={type}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                <span className="ml-auto text-xs text-gray-400">{post.comments_count} comments</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Load more */}
            {hasMore && !loading && (
                <div className="text-center mt-6">
                    <button
                        onClick={() => {
                            const next = page + 1;
                            setPage(next);
                            fetchPosts(next);
                        }}
                        className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium rounded-xl transition-colors"
                    >
                        Load more
                    </button>
                </div>
            )}
        </div>
    );
}
