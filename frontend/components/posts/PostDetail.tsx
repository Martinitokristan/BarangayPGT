'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import PostCard, { type PostData } from '@/components/posts/PostCard';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function PostDetail() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [post, setPost] = useState<PostData | null>(null);
    const [loading, setLoading] = useState(true);
    const [adminResponse, setAdminResponse] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [responding, setResponding] = useState(false);
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [responseSubmitted, setResponseSubmitted] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchPost = async () => {
        try {
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
            setAdminResponse(res.data.admin_response ?? '');
            setNewStatus(res.data.status);
            if (!res.data.admin_response) setShowAdminForm(true);
        } catch { showToast('Failed to load post.', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPost(); }, [id]);

    const handleAdminResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        setResponding(true);
        try {
            const data: Record<string, string> = {};
            if (adminResponse) data.admin_response = adminResponse;
            if (newStatus) data.status = newStatus;
            await api.put(`/posts/${id}`, data);
            await fetchPost();
            setResponseSubmitted(true);
            setShowAdminForm(false);
            showToast('Response submitted!', 'success');
        } catch { showToast('Failed to submit response.', 'error'); }
        finally { setResponding(false); }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/posts/${id}`);
            showToast('Post deleted.', 'success');
            router.push('/');
        } catch { showToast('Failed to delete post.', 'error'); }
        setShowDeleteModal(false);
    };

    const isAdmin = user?.role === 'admin';

    if (loading) return <div className="text-center py-12 text-gray-400">Loading post...</div>;
    if (!post) return <div className="text-center py-12 text-gray-400">Post not found.</div>;

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                ← Back
            </button>

            <PostCard post={post} onUpdate={(_, updated) => setPost(updated)} />

            {/* Admin response panel */}
            {isAdmin && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => { setShowAdminForm(!showAdminForm); setResponseSubmitted(false); }}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <span className="font-semibold text-gray-900 flex items-center gap-2">🛡️ Admin Actions</span>
                        <span className="text-gray-400">{showAdminForm ? '▲' : '▼'}</span>
                    </button>

                    {responseSubmitted && !showAdminForm && (
                        <div className="mx-4 mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
                            <span>✅ Response submitted successfully!</span>
                            <button onClick={() => { setShowAdminForm(true); setResponseSubmitted(false); }}
                                className="text-green-700 underline text-xs">Edit Response</button>
                        </div>
                    )}

                    {showAdminForm && (
                        <form onSubmit={handleAdminResponse} className="px-6 pb-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Update Status</label>
                                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50">
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Response</label>
                                <textarea rows={4} value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder="Write response to the resident..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 resize-none" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowAdminForm(false)}
                                    className="py-2.5 px-5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={responding}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60">
                                    {responding ? 'Saving...' : 'Submit Response'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            <ConfirmModal isOpen={showDeleteModal} title="Delete Post"
                message="Are you sure you want to delete this post?" confirmText="Delete" variant="danger"
                onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />
        </div>
    );
}
