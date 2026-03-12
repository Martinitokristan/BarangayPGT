import Login from '@/components/auth/Login';
import { Suspense } from 'react';

export const metadata = {
    title: 'Login | BarangayPGT',
};

export default function LoginRoute() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" />}>
            <Login />
        </Suspense>
    );
}
