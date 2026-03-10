'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface User {
    id: number; name: string; email: string; phone: string | null;
    role: string; is_approved: boolean; created_at: string;
    avatar: string | null; valid_id_path: string | null;
    barangay?: { name: string }; purok_address?: string;
}
interface Barangay { id: number; name: string; }
interface Lightbox { open: boolean; src: string; label: string; }

const SELECT = 'border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function AdminUsersPage() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [barangays, setBarangays] = useState<Barangay[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ role: '', barangay_id: '', is_approved: '' });
    const [expandedUser, setExpanded] = useState<number | null>(null);
    const [lightbox, setLightbox] = useState<Lightbox>({ open: false, src: '', label: '' });
    const [confirmTarget, setConfirmTarget] = useState<{ user: User; action: 'approve' | 'reject' } | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.role) params.append('role', filters.role);
            if (filters.barangay_id) params.append('barangay_id', filters.barangay_id);
            if (filters.is_approved) params.append('is_approved', filters.is_approved);
            const res = await api.get(`/admin/users?${params}`);
            setUsers(res.data.data);
        } catch { showToast('Failed to load users.', 'error'); }
        finally { setLoading(false); }
    }, [filters, showToast]);

    useEffect(() => {
        fetchUsers();
        api.get('/barangays').then((res) => setBarangays(res.data)).catch(() => { });
    }, [fetchUsers]);

    const handleRoleChange = async (user: User, newRole: string) => {
        try {
            await api.put(`/admin/users/${user.id}/role`, { role: newRole });
            showToast(`Role updated to ${newRole}.`, 'success');
            fetchUsers();
        } catch { showToast('Failed to update role.', 'error'); }
    };

    const handleConfirm = async () => {
        if (!confirmTarget) return;
        const { user, action } = confirmTarget;
        try {
            if (action === 'approve') {
                await api.post(`/admin/users/${user.id}/approve`);
                showToast('User approved!', 'success');
            } else {
                await api.delete(`/admin/users/${user.id}/reject`);
                showToast('User rejected and removed.', 'success');
            }
            fetchUsers();
        } catch { showToast(`Failed to ${action} user.`, 'error'); }
        setConfirmTarget(null);
    };

    const formatPhone = (phone: string | null) => {
        if (!phone) return null;
        return phone.startsWith('+') ? phone : `+63${phone.slice(1)}`;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
                <span className="text-sm text-gray-400">{users.length} users</span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className={SELECT}>
                    <option value="">All Roles</option>
                    <option value="resident">Residents</option>
                    <option value="admin">Admins</option>
                </select>
                <select value={filters.is_approved} onChange={(e) => setFilters({ ...filters, is_approved: e.target.value })} className={SELECT}>
                    <option value="">All Statuses</option>
                    <option value="1">Approved</option>
                    <option value="0">Pending</option>
                </select>
                <select value={filters.barangay_id} onChange={(e) => setFilters({ ...filters, barangay_id: e.target.value })} className={SELECT}>
                    <option value="">All Barangays</option>
                    {barangays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Loading users...</div>
            ) : (
                <div className="space-y-3">
                    {users.length === 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center text-gray-400 text-sm">
                            No users found matching the filters.
                        </div>
                    )}
                    {users.map((user) => (
                        <div key={user.id}
                            className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${!user.is_approved ? 'border-amber-200' : 'border-gray-100'}`}>
                            {/* Card top row */}
                            <div className="flex items-center gap-3 p-4 cursor-pointer"
                                onClick={() => setExpanded(expandedUser === user.id ? null : user.id)}>
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                    {user.avatar ? <img src={user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        : user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {user.is_approved ? 'Approved' : 'Pending'}
                                    </span>
                                    <span className="text-gray-300">{expandedUser === user.id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {expandedUser === user.id && (
                                <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div><span className="text-xs text-gray-400">Phone</span><p className="text-gray-700">{formatPhone(user.phone) ?? 'No phone'}</p></div>
                                        <div><span className="text-xs text-gray-400">Barangay</span><p className="text-gray-700">{user.barangay?.name ?? 'N/A'}{user.purok_address ? ` — ${user.purok_address}` : ''}</p></div>
                                        <div><span className="text-xs text-gray-400">Joined</span><p className="text-gray-700">{new Date(user.created_at).toLocaleDateString()}</p></div>
                                        <div>
                                            <span className="text-xs text-gray-400 block mb-1">Role</span>
                                            <select value={user.role} onChange={(e) => handleRoleChange(user, e.target.value)} className={`${SELECT} text-xs`}>
                                                <option value="resident">Resident</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Valid ID */}
                                    {user.valid_id_path && (
                                        <button onClick={() => setLightbox({ open: true, src: `/storage/${user.valid_id_path}`, label: `${user.name} — Valid ID` })}
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                            🪪 View Valid ID
                                        </button>
                                    )}

                                    {/* Approve / Reject actions */}
                                    {!user.is_approved && (
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => setConfirmTarget({ user, action: 'approve' })}
                                                className="flex-1 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 transition-colors">
                                                ✅ Approve
                                            </button>
                                            <button onClick={() => setConfirmTarget({ user, action: 'reject' })}
                                                className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors">
                                                ✕ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Image lightbox */}
            {lightbox.open && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightbox({ open: false, src: '', label: '' })}>
                    <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        <p className="text-white text-center text-sm mb-3">{lightbox.label}</p>
                        <img src={lightbox.src} alt={lightbox.label} className="w-full rounded-xl max-h-[70vh] object-contain" />
                        <button onClick={() => setLightbox({ open: false, src: '', label: '' })}
                            className="mt-3 w-full py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 text-sm">Close</button>
                    </div>
                </div>
            )}

            {/* Approve/Reject confirm */}
            <ConfirmModal
                isOpen={!!confirmTarget}
                title={confirmTarget?.action === 'approve' ? 'Approve User' : 'Reject User'}
                message={confirmTarget?.action === 'approve'
                    ? `Are you sure you want to approve ${confirmTarget?.user.name}?`
                    : `Are you sure you want to reject and permanently delete ${confirmTarget?.user.name}?`}
                confirmText={confirmTarget?.action === 'approve' ? 'Approve' : 'Reject & Delete'}
                variant={confirmTarget?.action === 'approve' ? 'primary' : 'danger'}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
}
