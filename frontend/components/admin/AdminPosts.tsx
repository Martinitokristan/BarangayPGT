'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface Post {
    id: number; title: string; purpose: string; urgency_level: string;
    status: string; created_at: string; user: { name: string };
}

const SELECT = 'border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500';
const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
};
const URGENCY_COLORS: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
};

export default function AdminPostsPage() {
    const { showToast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [filters, setFilters] = useState({ urgency_level: '', status: '', purpose: '', search: '' });

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page };
            Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
            const res = await api.get('/posts', { params });
            setPosts(res.data.data);
            setLastPage(res.data.last_page);
        } catch { showToast('Failed to load posts.', 'error'); }
        finally { setLoading(false); }
    }, [page, filters, showToast]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const handleStatusChange = async (postId: number, status: string) => {
        try {
            await api.put(`/posts/${postId}`, { status });
            setPosts(posts.map((p) => p.id === postId ? { ...p, status } : p));
            showToast('Status updated!', 'success');
        } catch { showToast('Failed to update status.', 'error'); }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">🛡️ Manage Posts</h1>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input type="text" name="search" value={filters.search} onChange={handleFilterChange}
                    placeholder="Search posts..."
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]" />
                <select name="urgency_level" value={filters.urgency_level} onChange={handleFilterChange} className={SELECT}>
                    <option value="">All Urgency</option>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                </select>
                <select name="status" value={filters.status} onChange={handleFilterChange} className={SELECT}>
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                </select>
                <select name="purpose" value={filters.purpose} onChange={handleFilterChange} className={SELECT}>
                    <option value="">All Types</option>
                    <option value="complaint">Complaint</option>
                    <option value="problem">Problem</option>
                    <option value="emergency">Emergency</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="general">General</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Loading posts...</div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400 text-sm">
                    No posts found matching your filters.
                </div>
            ) : (
                <>
                    {/* Posts list */}
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <div key={post.id}
                                className={`bg-white rounded-2xl shadow-sm border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${post.urgency_level === 'high' ? 'border-red-200' : 'border-gray-100'}`}>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <Link href={`/posts/${post.id}`} className="font-semibold text-gray-900 hover:text-blue-600 text-sm">
                                        {post.title}
                                    </Link>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${URGENCY_COLORS[post.urgency_level] ?? ''}`}>
                                            {post.urgency_level.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400 capitalize">{post.purpose}</span>
                                        <span className="text-xs text-gray-400">by {post.user?.name}</span>
                                        <span className="text-xs text-gray-300">#{post.id} · {new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Status select */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <select
                                        value={post.status}
                                        onChange={(e) => handleStatusChange(post.id, e.target.value)}
                                        className={`text-xs border rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[post.status] ?? 'bg-gray-100 text-gray-700'}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <Link href={`/posts/${post.id}`}
                                        className="text-xs text-blue-600 border border-blue-200 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors">
                                        View
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {lastPage > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                                ← Prev
                            </button>
                            <span className="text-sm text-gray-500">{page} / {lastPage}</span>
                            <button disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}
                                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
