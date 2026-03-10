'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ApprovalPending() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">
                    ⏳
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Approval Pending</h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    Thank you for registering! Your account is currently under review by a barangay administrator.
                    You will receive an email and SMS notification once your account has been approved.
                </p>

                <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-sm text-blue-700">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="text-left space-y-1 text-blue-600 text-xs list-disc list-inside">
                        <li>Admin reviews your registration details</li>
                        <li>You receive an email + SMS upon approval</li>
                        <li>Log in again to access the full platform</li>
                    </ul>
                </div>

                <button onClick={handleLogout}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-2xl transition-colors">
                    Sign Out
                </button>
            </div>
        </div>
    );
}
