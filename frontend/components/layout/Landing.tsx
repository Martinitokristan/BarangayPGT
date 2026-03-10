import Link from 'next/link';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 text-white font-bold text-lg flex items-center justify-center backdrop-blur-sm">
            B
          </div>
          <span className="text-white font-bold text-lg">BarangayPGT</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-white/80 hover:text-white text-sm font-medium transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-white text-blue-700 hover:bg-blue-50 text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm border border-white/20">
          🏘️ Official Barangay Online Platform
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mb-6">
          Your Barangay,{' '}
          <span className="text-blue-200">Connected</span>
        </h1>

        <p className="text-blue-100 text-lg max-w-xl mb-10 leading-relaxed">
          Stay informed, report concerns, and engage with your community — all in one place.
          BarangayPGT brings residents and administrators closer together.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/register"
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-xl text-sm"
          >
            Join the Community
          </Link>
          <Link
            href="/login"
            className="text-white border border-white/30 hover:bg-white/10 font-medium px-8 py-3.5 rounded-2xl transition-all text-sm"
          >
            Sign In →
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-14">
          {[
            { icon: '📢', label: 'Community Feed' },
            { icon: '📅', label: 'Barangay Events' },
            { icon: '🛡️', label: 'Admin Dashboard' },
            { icon: '📱', label: 'SMS Notifications' },
            { icon: '🔔', label: 'Real-time Alerts' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm px-4 py-2 rounded-full"
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-blue-200/60 text-xs py-6">
        © {new Date().getFullYear()} BarangayPGT — Official Community Platform
      </footer>
    </div>
  );
}
