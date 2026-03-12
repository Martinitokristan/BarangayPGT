'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function DeviceVerification() {
    const { pendingDeviceAuth, verifyDeviceCode, resendDeviceCode, logout } = useAuth();
    const { showToast } = useToast();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setRE] = useState(false);

    if (!pendingDeviceAuth) return null;

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyDeviceCode(code);
            showToast('Device verified successfully!', 'success');
        } catch {
            showToast('Invalid or expired code. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setRE(true);
        try {
            await resendDeviceCode();
            showToast('New verification code sent to your email.', 'info');
        } catch {
            showToast('Failed to resend code.', 'error');
        } finally {
            setRE(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-white text-2xl mb-4 shadow-lg">🔐</div>
                    <h1 className="text-2xl font-bold text-gray-900">New device detected</h1>
                    <p className="text-gray-500 mt-1">
                        Check your email for a 6-digit code sent to{' '}
                        <strong>{pendingDeviceAuth.data.user.email}</strong>
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <form onSubmit={handleVerify} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="123456"
                                className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all text-sm"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>

                    <div className="flex items-center justify-between mt-4 text-sm">
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-blue-600 hover:underline disabled:text-gray-400"
                        >
                            {resending ? 'Sending...' : 'Resend code'}
                        </button>
                        <button onClick={() => logout()} className="text-gray-500 hover:underline">
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
