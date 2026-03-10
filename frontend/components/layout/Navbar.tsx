'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (!user) return null;

    return (
        <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center">B</div>
                    <span className="font-semibold text-gray-900">BarangayPGT</span>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-1">
                    <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Feed
                    </Link>
                    <Link href="/events" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Events
                    </Link>
                    <Link href="/notifications" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Notifications
                    </Link>
                    {isAdmin && (
                        <Link href="/admin" className="px-3 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                            Admin
                        </Link>
                    )}
                </div>

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 hover:bg-gray-50 rounded-xl p-2 transition-colors"
                    >
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user.name}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                            <Link
                                href={`/users/${user.id}/profile`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                👤 Profile
                            </Link>
                            <hr className="my-1 border-gray-100" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                                🚪 Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
