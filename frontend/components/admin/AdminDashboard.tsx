'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardStats {
    users_count: number;
    pending_approval_count: number;
    posts_count: number;
    barangays_count: number;
    latest_users: Array<{ id: number; name: string; email: string; role: string; is_approved: boolean }>;
}

export default function AdminDashboard() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && !isAdmin) {
            router.push('/');
            return;
        }
        api.get('/admin/dashboard').then((res) => {
            setStats(res.data);
        }).catch(() => {
            router.push('/');
        }).finally(() => setLoading(false));
    }, [user, isAdmin, router]);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-gray-400 text-sm">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Overview of BarangayPGT system</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Users', value: stats.users_count, color: 'blue', icon: '👥' },
                    { label: 'Pending Approval', value: stats.pending_approval_count, color: 'amber', icon: '⏳' },
                    { label: 'Total Posts', value: stats.posts_count, color: 'green', icon: '📝' },
                    { label: 'Barangays', value: stats.barangays_count, color: 'purple', icon: '🏘️' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[
                    { href: '/admin/users', label: 'Manage Users', icon: '👤' },
                    { href: '/admin/posts', label: 'Manage Posts', icon: '📝' },
                    { href: '/admin/sms', label: 'SMS Broadcast', icon: '📱' },
                ].map((link) => (
                    <Link key={link.href} href={link.href}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-3">
                        <span className="text-xl">{link.icon}</span>
                        <span className="font-medium text-gray-700 text-sm">{link.label}</span>
                    </Link>
                ))}
            </div>

            {/* Latest users */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Latest Registrations</h2>
                <div className="space-y-3">
                    {stats.latest_users.map((u) => (
                        <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {u.is_approved ? 'Approved' : 'Pending'}
                            </span>
                        </div>
                    ))}
                </div>
                <Link href="/admin/users" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
                    View all users →
                </Link>
            </div>
        </div>
    );
}
