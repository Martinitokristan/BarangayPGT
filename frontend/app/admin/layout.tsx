import Navbar from '@/components/layout/Navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Admin sidebar */}
                    <aside className="w-48 flex-shrink-0 hidden md:block">
                        <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 space-y-1">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Admin</p>
                            {[
                                { href: '/admin', label: 'Dashboard', icon: '📊' },
                                { href: '/admin/users', label: 'Users', icon: '👥' },
                                { href: '/admin/posts', label: 'Posts', icon: '📝' },
                                { href: '/admin/sms', label: 'SMS', icon: '📱' },
                            ].map((item) => (
                                <a key={item.href} href={item.href}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </a>
                            ))}
                        </nav>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
        </>
    );
}
