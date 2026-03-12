'use client';

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { RiShieldStarFill, RiSearchLine, RiFilter3Fill } from "react-icons/ri";
import { HiChevronLeft, HiChevronRight, HiEye, HiBadgeCheck, HiClock, HiUser, HiTag } from "react-icons/hi";

export default function AdminPosts() {
    const { showToast } = useToast();
    const [posts, setPosts] = useState<any[]>([]);
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
            const params: any = { page };
            Object.entries(filters).forEach(([key, val]) => {
                if (val) params[key] = val;
            });
            const res = await api.get("/posts", { params });
            setPosts(res.data.data);
            setLastPage(res.data.last_page);
        } catch (e) {
            showToast("Failed to load posts.", "error");
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const handleStatusChange = async (postId: number, status: string) => {
        try {
            await api.put(`/posts/${postId}`, { status });
            // Optimistic update
            setPosts(posts.map(p => p.id === postId ? { ...p, status } : p));
            showToast("Status updated!", "success");
        } catch (e) {
            showToast("Failed to update status.", "error");
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
                <div className="search-box" style={{ position: 'relative' }}>
                    <input
                        type="text"
                        name="search"
                        placeholder="Search title or content..."
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="search-input"
                    />
                </div>
                <select
                    name="urgency_level"
                    value={filters.urgency_level}
                    onChange={handleFilterChange}
                >
                    <option value="">All Urgency</option>
                    <option value="high">High Urgency</option>
                    <option value="medium">Medium Urgency</option>
                    <option value="low">Low Urgency</option>
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
                <div className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 text-muted">Loading posts...</p>
                </div>
            ) : (
                <>
                    {/* Desktop View: Table */}
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Post Info</th>
                                    <th>Author</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className={post.urgency_level === "high" ? "row-urgent" : ""}
                                    >
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>
                                                <Link href={`/posts/${post.id}`}>{post.title}</Link>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                ID: {post.id} • {new Date(post.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="avatar-xs" style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                    {post.user?.name?.charAt(0)}
                                                </div>
                                                {post.user?.name}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span className={`badge-urgency urgency-${post.urgency_level}`}>
                                                    {post.urgency_level.toUpperCase()}
                                                </span>
                                                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>
                                                    {post.purpose}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <select
                                                value={post.status}
                                                onChange={(e) => handleStatusChange(post.id, e.target.value)}
                                                className={`status-select status-${post.status}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                        <td>
                                            <Link href={`/posts/${post.id}`} className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1">
                                                <HiEye /> View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="mobile-posts-grid">
                        {posts.map((post) => (
                            <div key={post.id} className="post-admin-card">
                                <div className="card-header-row">
                                    <div className="post-id-date">
                                        <span className="p-id">#{post.id}</span>
                                        <span className="p-date">{new Date(post.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`badge-urgency urgency-${post.urgency_level}`}>
                                        {post.urgency_level.toUpperCase()}
                                    </span>
                                </div>
                                <h4 className="card-title">
                                    <Link href={`/posts/${post.id}`}>{post.title}</Link>
                                </h4>
                                <div className="card-meta-grid">
                                    <div className="meta-item">
                                        <label><HiUser size={12} /> AUTHOR</label>
                                        <span title={post.user?.name}>{post.user?.name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <label><HiTag size={12} /> TYPE</label>
                                        <span style={{ textTransform: 'capitalize' }}>{post.purpose}</span>
                                    </div>
                                </div>
                                <div className="card-actions-row">
                                    <select
                                        value={post.status}
                                        onChange={(e) => handleStatusChange(post.id, e.target.value)}
                                        className={`status-select status-${post.status}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    <Link href={`/posts/${post.id}`} className="btn btn-primary btn-view">
                                        View
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {posts.length === 0 && (
                        <div className="empty-state py-5 text-center">
                            <RiSearchLine size={48} className="text-muted mb-3 opacity-25" />
                            <p className="text-muted">No posts found matching your filters.</p>
                        </div>
                    )}

                    {lastPage > 1 && (
                        <div className="pagination mt-4">
                            <button
                                className="btn btn-outline-secondary"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                <HiChevronLeft /> Prev
                            </button>
                            <span className="mx-3 align-self-center">
                                {page} / {lastPage}
                            </span>
                            <button
                                className="btn btn-outline-secondary"
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
